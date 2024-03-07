use std::rc::Rc;

use crate::{univ_lvl, Binding, BindingClosure, Ctx, Error, GlobalEnv, Lvl, Tm, TyCtx, Val};

/// A sequence of types. For each type, an argument of that type is bound in every subsequent type.
pub struct Telescope(pub Vec<Tm>);

impl Telescope {
    /// Adds the parameters to the context and their types to the type context, returning the
    /// resulting context and type context.
    fn add_to_ctx(
        &self,
        e: &GlobalEnv,
        mut c: Rc<Ctx>,
        mut tc: Rc<TyCtx>,
    ) -> Result<(Rc<Ctx>, Rc<TyCtx>), Error> {
        for (l, ty) in self.0.iter().enumerate() {
            ty.univ_lvl(e, &c, &tc)?;
            let ty = ty.eval(&c)?;
            c = Rc::new(Ctx::Cons(Val::Var(Lvl(l)), c));
            tc = Rc::new(TyCtx::Cons(ty, tc));
        }
        Ok((c, tc))
    }

    /// Validates that the telescope has universe level at most `max_univ_lvl`.
    fn validate_univ_level(
        &self,
        e: &GlobalEnv,
        c: &Rc<Ctx>,
        tc: &Rc<TyCtx>,
        max_univ_lvl: &univ_lvl::Expr,
    ) -> Result<(), Error> {
        let mut c = c.clone();
        let mut tc = tc.clone();
        for (l, ty) in self.0.iter().enumerate() {
            if ty.univ_lvl(e, &c, &tc)? > *max_univ_lvl {
                return Err(Error::TyMismatch);
            }
            let ty = ty.eval(&c)?;
            c = Rc::new(Ctx::Cons(Val::Var(Lvl(l)), c));
            tc = Rc::new(TyCtx::Cons(ty, tc));
        }
        Ok(())
    }

    /// Evaluates the telescope to a dependent product type chain that ends with `tail`.
    fn eval_to_pi(&self, c: &Rc<Ctx>, tail: Tm) -> Result<Val, Error> {
        if self.0.is_empty() {
            tail.eval(c)
        } else {
            let tail = self.0[1..].iter().fold(tail, |acc, ty| {
                Tm::Pi(Box::new(Binding {
                    bound_ty: ty.clone(),
                    body: acc,
                }))
            });
            Ok(Val::Pi(Box::new(BindingClosure::new(
                self.0[0].eval(c)?,
                tail,
                c.clone(),
            ))))
        }
    }

    /// Validates a currified application of the telescope to the arguments.
    fn validate_apply(
        &self,
        e: &GlobalEnv,
        c: &Rc<Ctx>,
        args: &[Tm],
        args_c: &Rc<Ctx>,
        args_tc: &Rc<TyCtx>,
    ) -> Result<(), Error> {
        if self.0.len() != args.len() {
            return Err(Error::TyMismatch);
        }
        let l = Lvl(c.len());
        let dummy = Tm::U(univ_lvl::Expr::default());
        let mut pi = self.eval_to_pi(c, dummy)?;
        let mut i = 0;
        while let Val::Pi(closure) = pi {
            let arg = &args[i];
            let ty = arg.ty_internal(e, args_c, args_tc)?;
            if !ty.beta_eq(l, &closure.ty, l)? {
                return Err(Error::TyMismatch);
            }
            pi = closure.apply(arg.eval(args_c)?)?;
            i += 1;
        }
        Ok(())
    }
}

/// A parameterized family of inductive types.
pub struct InductiveTypeFamily {
    /// The parameters of the family.
    ///
    /// They are bound in the indices and constructors, and constructors have to use them everytime
    /// they refer to the family.
    pub params: Telescope,

    /// The indices of the family.
    ///
    /// They are not bound in the constructors.
    pub indices: Telescope,

    /// The universe level to which the inducive types belong.
    pub univ_lvl: univ_lvl::Expr,

    /// The number of universe variables that are used in the family.
    pub univ_vars: usize,

    /// The constructors of the family.
    pub ctors: Vec<Ctor>,
}

impl InductiveTypeFamily {
    /// Validates the inductive type family.
    fn validate(&self, e: &GlobalEnv) -> Result<(), Error> {
        let (inductive_c, inductive_tc) =
            self.params
                .add_to_ctx(e, Rc::new(Ctx::Nil), Rc::new(TyCtx::Nil))?;
        self.indices
            .validate_univ_level(e, &inductive_c, &inductive_tc, &self.univ_lvl)?;
        for ctor in &self.ctors {
            if ctor.indices.len() != self.indices.0.len() {
                return Err(Error::TyMismatch);
            }
            let c = inductive_c.clone();
            let tc = inductive_tc.clone();
            for param in &ctor.params {
                c.push(Val::Var(Lvl(c.len())));
                tc.push(param.validate(e, &c, &tc, &self.indices, &inductive_c, &self.univ_lvl)?);
            }
            self.indices
                .validate_apply(e, &inductive_c, &ctor.indices, &c, &tc)?;
        }
        Ok(())
    }
}

/// A constructor of an inductive type family.
pub struct Ctor {
    /// The types of parameters of the constructor.
    pub params: Vec<CtorParam>,

    /// The indices for the constructed value.
    ///
    /// For example, if the inductive type family is `F` with parameters `p : A, q : B` and indices
    /// `i : I, j : J`, then constructor `C : (p : A) -> (q : B) -> (i : I) -> C i t`, then
    /// `indices` contains the terms `i` and `t`.
    pub indices: Vec<Tm>,
}

/// A constructor parameter type, which is a chain of zero or more dependent type products with
/// additional constraints to ensure strict positivity.
pub struct CtorParam {
    /// The telescope of the parameter type.
    pub tele: Telescope,

    /// The last type in the chain of dependent product types.
    pub last: CtorParamLast,
}

impl CtorParam {
    /// Validates the constructor parameter type and returns a value that represents it.
    fn validate(
        &self,
        e: &GlobalEnv,
        c: &Rc<Ctx>,
        tc: &Rc<TyCtx>,
        inductive_indices: &Telescope,
        inductive_c: &Rc<Ctx>,
        max_univ_lvl: &univ_lvl::Expr,
    ) -> Result<Val, Error> {
        let tail = match &self.last {
            CtorParamLast::This { indices } => {
                if indices.len() != inductive_indices.0.len() {
                    return Err(Error::TyMismatch);
                }
                let (c, tc) = self.tele.add_to_ctx(e, c.clone(), tc.clone())?;
                inductive_indices.validate_apply(e, inductive_c, &indices, &c, &tc)?;
                todo!()
            }
            CtorParamLast::Other(ty) => {
                let (c, tc) = self.tele.add_to_ctx(e, c.clone(), tc.clone())?;
                if ty.univ_lvl(e, &c, &tc)? > *max_univ_lvl {
                    return Err(Error::TyMismatch);
                }
                ty.eval(&c)?
            }
        };
        self.tele.eval_to_pi(&c, tail.reify(Lvl(c.len()))?)
    }
}

/// The last type in the chain of dependent product types representing a constructor parameter.
///
/// See [`CtorParam`].
pub enum CtorParamLast {
    /// The inductive type family being defined, applied to the bound parameters and given indices,
    /// which must have the same length as the indices of the family (i.e the inductive type family
    /// must be fully applied).
    This { indices: Vec<Tm> },

    /// Another type, which does not contain the inductive type family being defined.
    Other(Tm),
}

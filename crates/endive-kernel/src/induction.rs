use std::{num::NonZeroUsize, rc::Rc};

use crate::{
    closure::Closure, univ_lvl, Binding, BindingClosure, Ctx, Error, GlobalEnv, Lvl, Tm, TyCtx, Val,
};

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
            let ty = ty.eval(&e, &c)?;
            c = Rc::new(Ctx::Cons(Val::Var(Lvl(l)), c));
            tc = Rc::new(TyCtx::Cons(ty, tc));
        }
        Ok((c, tc))
    }

    /// Validates that the telescope has universe level at most `max_univ_lvl`.
    fn validate_univ_level_at_most(
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
            let ty = ty.eval(&e, &c)?;
            c = Rc::new(Ctx::Cons(Val::Var(Lvl(l)), c));
            tc = Rc::new(TyCtx::Cons(ty, tc));
        }
        Ok(())
    }

    /// Evaluates the telescope to a dependent product type chain that ends with `tail`.
    fn eval_to_pi(&self, e: &GlobalEnv, c: &Rc<Ctx>, tail: Tm) -> Result<Val, Error> {
        if self.0.is_empty() {
            tail.eval(&e, c)
        } else {
            let tail = self.0[1..].iter().fold(tail, |acc, ty| {
                Tm::Pi(Box::new(Binding {
                    bound_ty: ty.clone(),
                    body: acc,
                }))
            });
            Ok(Val::Pi(Box::new(BindingClosure::new(
                self.0[0].eval(&e, c)?,
                tail,
                c.clone(),
            ))))
        }
    }

    /// Validates a currified application of the telescope to the arguments. The evaluated
    /// arguments along with the resulting context are returned.
    pub(crate) fn validate_apply(
        &self,
        e: &GlobalEnv,
        mut c: Rc<Ctx>,
        args: &[Tm],
        args_c: &Rc<Ctx>,
        args_tc: &Rc<TyCtx>,
    ) -> Result<(Vec<Val>, Rc<Ctx>), Error> {
        if self.0.len() != args.len() {
            return Err(Error::TyMismatch);
        }
        let mut evaluated_args = Vec::new();
        let l = Lvl(args_c.len());
        for (arg, expected_ty) in args.iter().zip(self.0.iter()) {
            let arg_ty = arg.ty_internal(e, args_c, args_tc)?;
            let expected_ty = expected_ty.eval(&e, &c)?;
            if !arg_ty.beta_eq(e, l, &expected_ty, l)? {
                return Err(Error::TyMismatch);
            }
            let evaluated_arg = arg.eval(&e, args_c)?;
            evaluated_args.push(evaluated_arg.clone());
            c = c.push(evaluated_arg);
        }
        Ok((evaluated_args, c))
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
    pub(crate) fn induction_principle(
        &self,
        e: &GlobalEnv,
        inductive_idx: usize,
        inductive_args: Vec<Val>,
        motive: Closure,
        cases: Vec<CaseVal>,
        val: Val,
    ) -> Result<Val, Error> {
        let Val::Ctor {
            inductive_idx: ctor_inductive_idx,
            ctor_idx,
            ctor_args,
            ..
        } = &val
        else {
            return Ok(Val::Induction {
                inductive_idx,
                inductive_args,
                motive: Box::new(motive),
                cases,
                val: Box::new(val),
            });
        };
        if *ctor_inductive_idx != inductive_idx || cases.len() != self.ctors.len() {
            return Ok(Val::Induction {
                inductive_idx,
                inductive_args,
                motive: Box::new(motive),
                cases,
                val: Box::new(val),
            });
        }
        let Some(ctor) = self.ctors.get(*ctor_idx) else {
            return Ok(Val::Induction {
                inductive_idx,
                inductive_args,
                motive: Box::new(motive),
                cases,
                val: Box::new(val),
            });
        };
        if ctor_args.len() != ctor.params.len() {
            return Ok(Val::Induction {
                inductive_idx,
                inductive_args,
                motive: Box::new(motive),
                cases,
                val: Box::new(val),
            });
        }
        let case = &cases[*ctor_idx];
        match case {
            CaseVal::Constant(val) => Ok(val.clone()),
            CaseVal::Closure { param_count, body } => {
                let mut c = body.c.clone();
                let mut expected_param_count = 0;
                for (ctor_arg, ctor_param) in ctor_args.iter().zip(ctor.params.iter()) {
                    if ctor_param.is_self() {
                        c = c.push(self.induction_principle(
                            e,
                            inductive_idx,
                            inductive_args.clone(),
                            motive.clone(),
                            cases.clone(),
                            ctor_arg.clone(),
                        )?);
                        expected_param_count += 1;
                    }
                    c = c.push(ctor_arg.clone());
                    expected_param_count += 1;
                }
                if param_count.get() != expected_param_count {
                    return Ok(Val::Induction {
                        inductive_idx,
                        inductive_args,
                        motive: Box::new(motive),
                        cases,
                        val: Box::new(val),
                    });
                }
                body.body.eval(e, &c)
            }
        }
    }

    /// Validates the inductive type family.
    ///
    /// The validation requires the family to already be added to the global environment at the
    /// index `idx`.
    pub(crate) fn validate(&self, e: &GlobalEnv, idx: usize) -> Result<(), Error> {
        let (inductive_c, inductive_tc) =
            self.params
                .add_to_ctx(e, Rc::new(Ctx::Nil), Rc::new(TyCtx::Nil))?;
        let args = inductive_c.iter().map(|v| v.clone()).collect::<Vec<_>>();
        self.indices
            .validate_univ_level_at_most(e, &inductive_c, &inductive_tc, &self.univ_lvl)?;
        for ctor in &self.ctors {
            if ctor.indices.len() != self.indices.0.len() {
                return Err(Error::TyMismatch);
            }
            let c = inductive_c.clone();
            let tc = inductive_tc.clone();
            for param in &ctor.params {
                c.push(Val::Var(Lvl(c.len())));
                tc.push(param.eval_and_validate_univ_lvl_at_most(
                    e,
                    &c,
                    &tc,
                    &args,
                    &self.indices,
                    &inductive_c,
                    &self.univ_lvl,
                    idx,
                )?);
            }
            self.indices
                .validate_apply(e, inductive_c.clone(), &ctor.indices, &c, &tc)?;
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
    /// `i : I, j : J`, then for constructor `C : (p : A) -> (q : B) -> (i : I) -> C i t`,
    /// `indices` contains the terms `i` and `t`.
    pub indices: Vec<Tm>,
}

impl Ctor {
    /// Validates a constructor application and returns the indices of the returned inductive type.
    pub(crate) fn validate_apply(
        &self,
        e: &GlobalEnv,
        inductive_idx: usize,
        inductive_args: &[Val],
        inductive_indices: &Telescope,
        mut inductive_c: Rc<Ctx>,
        args: &[Tm],
        args_c: &Rc<Ctx>,
        args_tc: &Rc<TyCtx>,
    ) -> Result<Vec<Val>, Error> {
        if self.params.len() != args.len() {
            return Err(Error::TyMismatch);
        }
        let l = Lvl(args_c.len());
        for (arg, param) in args.iter().zip(&self.params) {
            let arg_ty = arg.ty_internal(e, args_c, args_tc)?;
            let expected_ty = param.eval(
                e,
                args_c,
                args_tc,
                inductive_args,
                inductive_indices,
                &inductive_c,
                inductive_idx,
            )?;
            if !arg_ty.beta_eq(e, l, &expected_ty, l)? {
                return Err(Error::TyMismatch);
            }
            inductive_c = inductive_c.push(expected_ty);
        }
        let (indices, _) =
            inductive_indices.validate_apply(e, inductive_c, &self.indices, args_c, args_tc)?;
        Ok(indices)
    }
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
    /// Returns whether the parameter type is the inductive type family being defined.
    fn is_self(&self) -> bool {
        self.tele.0.is_empty() && matches!(&self.last, CtorParamLast::This { .. })
    }

    /// Evaluates the constructor parameter type to a WHNF term.
    fn eval(
        &self,
        e: &GlobalEnv,
        c: &Rc<Ctx>,
        tc: &Rc<TyCtx>,
        inductive_args: &[Val],
        inductive_indices: &Telescope,
        inductive_c: &Rc<Ctx>,
        inductive_idx: usize,
    ) -> Result<Val, Error> {
        let tail = match &self.last {
            CtorParamLast::This { indices } => {
                if indices.len() != inductive_indices.0.len() {
                    return Err(Error::TyMismatch);
                }
                let (c, tc) = self.tele.add_to_ctx(e, c.clone(), tc.clone())?;
                let (indices, _) =
                    inductive_indices.validate_apply(e, inductive_c.clone(), &indices, &c, &tc)?;
                Val::Inductive {
                    idx: inductive_idx,
                    args: inductive_args.to_vec(),
                    indices,
                }
            }
            CtorParamLast::Other(ty) => {
                let (c, tc) = self.tele.add_to_ctx(e, c.clone(), tc.clone())?;
                ty.univ_lvl(e, &c, &tc)?;
                ty.eval(&e, &c)?
            }
        };
        self.tele.eval_to_pi(&e, &c, tail.reify(e, Lvl(c.len()))?)
    }

    /// Evaluates the constructor parameter type to a WHNF term and validates that its type belongs
    /// to universe level at most `max_univ_lvl`.
    fn eval_and_validate_univ_lvl_at_most(
        &self,
        e: &GlobalEnv,
        c: &Rc<Ctx>,
        tc: &Rc<TyCtx>,
        inductive_args: &[Val],
        inductive_indices: &Telescope,
        inductive_c: &Rc<Ctx>,
        max_univ_lvl: &univ_lvl::Expr,
        inductive_idx: usize,
    ) -> Result<Val, Error> {
        let tail = match &self.last {
            CtorParamLast::This { indices } => {
                if indices.len() != inductive_indices.0.len() {
                    return Err(Error::TyMismatch);
                }
                let (c, tc) = self.tele.add_to_ctx(e, c.clone(), tc.clone())?;
                let (indices, _) =
                    inductive_indices.validate_apply(e, inductive_c.clone(), &indices, &c, &tc)?;
                Val::Inductive {
                    idx: inductive_idx,
                    args: inductive_args.to_vec(),
                    indices,
                }
            }
            CtorParamLast::Other(ty) => {
                let (c, tc) = self.tele.add_to_ctx(e, c.clone(), tc.clone())?;
                if ty.univ_lvl(e, &c, &tc)? > *max_univ_lvl {
                    return Err(Error::TyMismatch);
                }
                ty.eval(&e, &c)?
            }
        };
        self.tele.eval_to_pi(&e, &c, tail.reify(e, Lvl(c.len()))?)
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

/// A case in an application of the induction principle.
#[derive(Clone, PartialEq, Eq, Debug)]
pub struct Case {
    /// The number of variables bound in the case.
    pub param_count: usize,

    /// The body of the case.
    pub body: Tm,
}

/// A case in an application of the induction principle, with the body represented as a closure.
#[derive(Clone, Debug)]
pub(crate) enum CaseVal {
    /// A case that is directly a value when the corresponding constructor does not take any
    /// argument.
    Constant(Val),

    /// A case that is a closure.
    Closure {
        /// The number of variables bound in the case.
        param_count: NonZeroUsize,

        /// The body of the case.
        body: Closure,
    },
}

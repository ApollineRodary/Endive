use std::{num::NonZeroUsize, rc::Rc};

use crate::{
    closure::{BindingClosure, Closure},
    ctx::{Ctx, TyCtx},
    univ_lvl,
    val::{Lvl, Val},
    Case, CaseVal, Error, GlobalEnv,
};

/// de Bruijn index.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub struct Ix(pub usize);

/// Binding of a variable in a lambda term.
#[derive(Clone, PartialEq, Eq, Debug)]
pub struct Binding {
    /// Type of the bound variable.
    pub bound_ty: Tm,

    /// Body of the binding.
    pub body: Tm,
}

impl Binding {
    /// Evaluates the abstraction to a closure in the given local context.
    fn eval(&self, e: &GlobalEnv, c: &Rc<Ctx>) -> Result<BindingClosure, Error> {
        Ok(BindingClosure::new(
            self.bound_ty.eval(e, c)?,
            self.body.clone(),
            c.clone(),
        ))
    }
}

/// Lambda term.
#[derive(Clone, PartialEq, Eq, Debug)]
pub enum Tm {
    /// Variable.
    Var(Ix),

    /// Lambda abstraction.
    Abs(Box<Binding>),

    /// Application.
    App(Box<Tm>, Box<Tm>),

    /// Dependent product type.
    Pi(Box<Binding>),

    /// Type universe.
    U(univ_lvl::Expr),

    /// Inductive type family.
    Inductive {
        /// Index of the inductive type family in the global environment.
        idx: usize,

        /// Arguments to the inductive type family.
        args: Vec<Tm>,

        /// Indices of the inductive type.
        indices: Vec<Tm>,
    },

    /// Constructor of an inductive type.
    Ctor {
        /// Index of the inductive type family in the global environment.
        inductive_idx: usize,

        /// Arguments to the inductive type family.
        inductive_args: Vec<Tm>,

        /// Index of the constructor.
        ctor_idx: usize,

        /// Arguments to the constructor.
        ctor_args: Vec<Tm>,
    },

    /// Principle of induction.
    Induction {
        /// Index of the inductive type family in the global environment.
        inductive_idx: usize,

        /// Arguments to the inductive type family.
        inductive_args: Vec<Tm>,

        /// Motive of the induction.
        motive: Box<Tm>,

        /// Cases of the induction.
        cases: Vec<Case>,

        /// Value on which to perform the induction.
        val: Box<Tm>,
    },
}

impl Tm {
    /// Evaluates a lambda term to weak head normal form in the given local context.
    pub(crate) fn eval(&self, e: &GlobalEnv, c: &Rc<Ctx>) -> Result<Val, Error> {
        match self {
            Tm::Var(i) => c.get(*i).ok_or(Error::IxOverflow).cloned(),
            Tm::Abs(abs) => Ok(Val::Abs(Box::new(abs.eval(e, c)?))),
            Tm::App(n, m) => {
                let n = n.eval(e, c)?;
                let m = m.eval(e, c)?;
                match n {
                    Val::Abs(closure) => closure.apply(e, m),
                    _ => Ok(Val::App(Box::new(n), Box::new(m))),
                }
            }
            Tm::Pi(abs) => Ok(Val::Pi(Box::new(abs.eval(e, c)?))),
            Tm::U(n) => Ok(Val::U(n.clone())),
            Tm::Inductive { idx, args, indices } => Ok(Val::Inductive {
                idx: *idx,
                args: args
                    .iter()
                    .map(|arg| arg.eval(e, c))
                    .collect::<Result<_, _>>()?,
                indices: indices
                    .iter()
                    .map(|index| index.eval(e, c))
                    .collect::<Result<_, _>>()?,
            }),
            Tm::Ctor {
                inductive_idx,
                inductive_args,
                ctor_idx,
                ctor_args,
            } => Ok(Val::Ctor {
                inductive_idx: *inductive_idx,
                inductive_args: inductive_args
                    .iter()
                    .map(|arg| arg.eval(e, c))
                    .collect::<Result<_, _>>()?,
                ctor_idx: *ctor_idx,
                ctor_args: ctor_args
                    .iter()
                    .map(|arg| arg.eval(e, c))
                    .collect::<Result<_, _>>()?,
            }),
            Tm::Induction {
                inductive_idx,
                inductive_args,
                motive,
                cases,
                val,
            } => {
                let inductive_args = inductive_args
                    .iter()
                    .map(|arg| arg.eval(e, c))
                    .collect::<Result<_, _>>()?;
                let motive = Closure {
                    body: (**motive).clone(),
                    c: c.clone(),
                };
                let cases = cases
                    .iter()
                    .map(|case| {
                        if let Some(param_count) = NonZeroUsize::new(case.param_count) {
                            Ok(CaseVal::Closure {
                                param_count,
                                body: Closure {
                                    body: case.body.clone(),
                                    c: c.clone(),
                                },
                            })
                        } else {
                            Ok(CaseVal::Constant(case.body.eval(e, c)?))
                        }
                    })
                    .collect::<Result<_, _>>()?;
                let val = val.eval(e, c)?;
                let inductive = e
                    .inductives
                    .get(*inductive_idx)
                    .ok_or(Error::InductiveOutOfBound)?;
                inductive.induction_principle(e, *inductive_idx, inductive_args, motive, cases, val)
            }
        }
    }

    /// Beta normalizes the lambda term.
    pub fn normalize(&self, e: &GlobalEnv) -> Result<Tm, Error> {
        // Normalization by Evaluation
        self.eval(e, &Default::default())?.reify(e, Lvl(0))
    }

    /// Beta equivalence.
    pub fn beta_eq(&self, e: &GlobalEnv, other: &Tm) -> Result<bool, Error> {
        let c = Default::default();
        self.eval(e, &c)?
            .beta_eq(e, Lvl(0), &other.eval(e, &c)?, Lvl(0))
    }

    /// Infers the type of the lambda term using rules from Pure Type Systems.
    pub fn ty(&self, e: &GlobalEnv) -> Result<Tm, Error> {
        self.ty_internal(e, &Default::default(), &Default::default())?
            .reify(e, Lvl(0))
    }

    /// Infers the type of the lambda term using rules from Pure Type Systems.
    ///
    /// Unlike [`ty`] which is the public interface, this method takes a local context and a typing
    /// local context as arguments and returns a value corresponding to the inferred type. This is
    /// useful for inferring the type of a subterm in a larger term.
    pub(crate) fn ty_internal(
        &self,
        e: &GlobalEnv,
        c: &Rc<Ctx>,
        tc: &Rc<TyCtx>,
    ) -> Result<Val, Error> {
        let l = Lvl(c.len());

        match self {
            Tm::Var(i) => tc.get(*i).ok_or(Error::IxOverflow).cloned(),
            Tm::Abs(abs) => {
                // Check that the type of the bound variable is a type.
                abs.bound_ty.univ_lvl(e, c, tc)?;

                let ty = abs.bound_ty.clone().eval(e, c)?;

                let body_ty =
                    abs.body
                        .ty_internal(e, &c.push(Val::Var(l)), &tc.push(ty.clone()))?;

                Ok(Val::Pi(Box::new(BindingClosure::new(
                    ty,
                    body_ty.reify(e, Lvl(l.0 + 1))?,
                    c.clone(),
                ))))
            }
            Tm::App(n, m) => match n.ty_internal(e, c, tc)? {
                Val::Pi(closure) => {
                    let m_ty = m.ty_internal(e, c, tc)?.reify(e, l);
                    let param_ty = closure.ty.reify(e, l);
                    if m_ty == param_ty {
                        Ok(closure
                            .closure
                            .body
                            .eval(e, &closure.closure.c.push(m.clone().eval(e, c)?))?)
                    } else {
                        Err(Error::TyMismatch)
                    }
                }
                _ => Err(Error::TyMismatch),
            },
            Tm::Pi(abs) => {
                let ty_u = abs.bound_ty.univ_lvl(e, c, tc)?;
                let ty = abs.bound_ty.clone().eval(e, c)?;

                let body_u = abs.body.univ_lvl(e, &c.push(Val::Var(l)), &tc.push(ty))?;

                Ok(Val::U(ty_u.max(&body_u)))
            }
            Tm::U(u) => Ok(Val::U(u.clone() + 1)),
            Tm::Inductive { idx, args, indices } => {
                let inductive = e.inductives.get(*idx).ok_or(Error::InductiveOutOfBound)?;
                let (_args, inductive_c) =
                    inductive
                        .params
                        .validate_apply(e, Rc::new(Ctx::Nil), &args, c, tc)?;
                let (_indices, _inductive_c) =
                    inductive
                        .indices
                        .validate_apply(e, inductive_c, indices, c, tc)?;
                Ok(Val::U(inductive.univ_lvl.clone()))
            }
            Tm::Ctor {
                inductive_idx,
                inductive_args,
                ctor_idx,
                ctor_args,
            } => {
                let inductive = e
                    .inductives
                    .get(*inductive_idx)
                    .ok_or(Error::InductiveOutOfBound)?;
                let ctor = inductive
                    .ctors
                    .get(*ctor_idx)
                    .ok_or(Error::CtorOutOfBound)?;

                let (inductive_args, inductive_c) = inductive.params.validate_apply(
                    e,
                    Rc::new(Ctx::Nil),
                    &inductive_args,
                    c,
                    tc,
                )?;
                let indices = ctor.validate_apply(
                    e,
                    *inductive_idx,
                    &inductive_args,
                    &inductive.indices,
                    inductive_c,
                    &ctor_args,
                    c,
                    tc,
                )?;

                Ok(Val::Inductive {
                    idx: *inductive_idx,
                    args: inductive_args,
                    indices,
                })
            }
            Tm::Induction {
                inductive_idx,
                inductive_args,
                motive,
                cases,
                val,
            } => {
                let inductive = e
                    .inductives
                    .get(*inductive_idx)
                    .ok_or(Error::InductiveOutOfBound)?;

                let (inductive_args, inductive_c) = inductive.params.validate_apply(
                    e,
                    Rc::new(Ctx::Nil),
                    &inductive_args,
                    c,
                    tc,
                )?;

                let (motive_c, motive_tc) = inductive.add_motive_telescope_to_ctx(
                    e,
                    *inductive_idx,
                    inductive_args.clone(),
                    c.clone(),
                    tc.clone(),
                )?;

                // Check that the type of the motive is of the form `Πx1. ... Πxk.(F x1 ... xk) → U(l)`.
                match motive.ty_internal(e, &motive_c, &motive_tc)? {
                    Val::U(_) => {}
                    _ => return Err(Error::TyMismatch),
                }

                let motive_closure = Closure {
                    body: (**motive).clone(),
                    c: motive_c.clone(),
                };

                // Type check the cases.
                for (case, ctor) in cases.iter().zip(inductive.ctors.iter()) {
                    let (case_c, case_tc, constructed_value_indices, param_count) = ctor
                        .add_case_telescope_to_ctx(
                            e,
                            *inductive_idx,
                            &inductive_args,
                            &inductive.indices,
                            &inductive_c,
                            &motive_closure,
                            c.clone(),
                            tc.clone(),
                        )?;

                    if case.param_count != param_count {
                        return Err(Error::TyMismatch);
                    }

                    let case_ty = case.body.ty_internal(e, &case_c, &case_tc)?;

                    let mut motive_c = c.clone();
                    for index in &constructed_value_indices {
                        motive_c = motive_c.push(index.clone());
                    }
                    motive_c = motive_c.push(Val::Inductive {
                        idx: *inductive_idx,
                        args: inductive_args.clone(),
                        indices: constructed_value_indices,
                    });

                    let expected_ty = motive.eval(e, &motive_c)?;

                    if !case_ty.beta_eq(e, Lvl(case_c.len()), &expected_ty, Lvl(case_c.len()))? {
                        return Err(Error::TyMismatch);
                    }
                }

                let val_ty = val.ty_internal(e, c, tc)?;

                // Construct the output type of the induction by applying the motive to the value.
                match val_ty {
                    Val::Inductive { idx, args, indices } if idx == *inductive_idx => {
                        // Verify that the arguments to the inductive type family are the same as the
                        // ones given to the induction.
                        for (arg, val_arg) in inductive_args.iter().zip(args.iter()) {
                            if !arg.beta_eq(e, l, val_arg, l)? {
                                return Err(Error::TyMismatch);
                            }
                        }

                        let mut motive_c = c.clone();
                        for index in indices {
                            motive_c = motive_c.push(index);
                        }
                        motive_c = motive_c.push(val.eval(e, c)?);

                        motive.eval(e, &motive_c)
                    }
                    _ => Err(Error::TyMismatch),
                }
            }
        }
    }

    /// Computes the level of the universe to which the lambda term belongs.
    pub(crate) fn univ_lvl(
        &self,
        e: &GlobalEnv,
        c: &Rc<Ctx>,
        tc: &Rc<TyCtx>,
    ) -> Result<univ_lvl::Expr, Error> {
        match self.ty_internal(e, c, tc)? {
            Val::U(n) => Ok(n),
            _ => Err(Error::TyMismatch),
        }
    }

    /// Adds `by` to the de Bruijn indices in the lambda term.
    pub(crate) fn lift(&mut self, by: usize) {
        match self {
            Tm::Var(i) => i.0 += by,
            Tm::Abs(abs) => {
                abs.bound_ty.lift(by);
                abs.body.lift(by);
            }
            Tm::App(m, n) => {
                m.lift(by);
                n.lift(by);
            }
            Tm::Pi(abs) => {
                abs.bound_ty.lift(by);
                abs.body.lift(by);
            }
            Tm::U(_n) => {}
            Tm::Inductive { args, indices, .. } => {
                for arg in args {
                    arg.lift(by);
                }
                for index in indices {
                    index.lift(by);
                }
            }
            Tm::Ctor {
                inductive_args,
                ctor_args,
                ..
            } => {
                for arg in inductive_args {
                    arg.lift(by);
                }
                for arg in ctor_args {
                    arg.lift(by);
                }
            }
            Tm::Induction {
                inductive_args,
                motive,
                cases,
                val,
                ..
            } => {
                for arg in inductive_args {
                    arg.lift(by);
                }
                motive.lift(by);
                for case in cases {
                    case.body.lift(by);
                }
                val.lift(by);
            }
        }
    }
}

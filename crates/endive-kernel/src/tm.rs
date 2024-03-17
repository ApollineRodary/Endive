use std::{num::NonZeroUsize, rc::Rc};

use crate::{
    closure::{BindingClosure, Closure},
    ctx::{Ctx, TyCtx},
    univ_lvl,
    val::{Lvl, Val, Variance},
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

    /// Inductive type family.
    OldFix {
        /// Type.
        ty: Box<Tm>,

        /// Constructors.
        ctors: Vec<Tm>,
    },

    /// The `i`-th constructor of the inductive type family.
    OldCtor {
        /// The inductive type family.
        fix: Box<Tm>,

        /// Index of the constructor.
        i: usize,

        /// Arguments to the constructor.
        args: Vec<Tm>,
    },

    /// Principle of induction.
    OldInd {
        /// Value on which to perform the induction.
        val: Box<Tm>,

        /// Motive of the induction.
        motive: Box<Tm>,

        /// Cases of the induction.
        cases: Vec<Tm>,
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
            Tm::OldFix { ty, ctors } => Ok(Val::OldFix {
                ty: ty.eval(e, c)?.into(),
                ctors: ctors
                    .iter()
                    .map(|ctor| ctor.eval(e, c))
                    .collect::<Result<_, _>>()?,
            }),
            Tm::OldCtor { fix, i, args } => Ok(Val::OldCtor {
                fix: Box::new(fix.eval(e, c)?),
                i: *i,
                args: args
                    .iter()
                    .map(|arg| arg.eval(e, c))
                    .collect::<Result<_, _>>()?,
            }),
            Tm::OldInd { motive, cases, val } => {
                let motive = motive.eval(e, c)?;
                let cases = cases
                    .iter()
                    .map(|case| case.eval(e, c))
                    .collect::<Result<_, _>>()?;
                let val = val.eval(e, c)?;
                val.induction(e, motive, cases, Lvl(c.len()))
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
            Tm::OldFix { ty, ctors } => {
                ty.ty_internal(e, c, tc)?;

                let ty = ty.clone().eval(e, c)?;
                let uncurrified = ty.uncurrify_pi(e, l)?;
                let universe = match uncurrified.out {
                    Val::U(n) => n,
                    _ => return Err(Error::TyMismatch),
                };

                // Check that the indices belong to a universe strictly smaller than the universe
                // of the inductive type family.
                for index in &uncurrified.args {
                    if index.reify(e, l)?.univ_lvl(e, c, tc)? >= universe {
                        return Err(Error::TyMismatch);
                    }
                }

                for ctor in ctors {
                    match ctor.ty_internal(e, c, tc)? {
                        Val::Pi(closure) if closure.ty.beta_eq(e, l, &ty, l)? => {}
                        _ => return Err(Error::TyMismatch),
                    }

                    let ctor_uncurrified = ctor
                        .eval(e, c)?
                        .apply(e, Val::Var(l))?
                        .uncurrify_pi(e, Lvl(l.0 + 1))?;

                    for (i, arg) in ctor_uncurrified.args.iter().enumerate() {
                        arg.check_ctor_param(
                            e,
                            Lvl(l.0 + 1 + i),
                            l,
                            &universe,
                            uncurrified.args.len(),
                            Variance::Covariant,
                        )?;
                    }

                    let out_uncurrified = ctor_uncurrified.out.uncurrify_app()?;

                    match out_uncurrified.f {
                        Val::Var(k) if k == l => {}
                        _ => return Err(Error::TyMismatch),
                    }

                    if out_uncurrified.args.len() != uncurrified.args.len() {
                        return Err(Error::TyMismatch);
                    }
                }

                Ok(ty)
            }
            Tm::OldCtor { fix, i, args } => {
                fix.ty_internal(e, c, tc)?;

                let mut ctor = match fix.eval(e, c)? {
                    Val::OldFix { ty, ctors } => ctors
                        .get(*i)
                        .cloned()
                        .ok_or(Error::TyMismatch)?
                        .apply(e, Val::OldFix { ty, ctors })?,
                    _ => return Err(Error::TyMismatch),
                };

                // Check that the constructor is called with the right arguments.
                for (i, arg) in args.iter().enumerate() {
                    let arg_ty = arg.ty_internal(e, c, tc)?;
                    ctor = match &ctor {
                        Val::Pi(closure) => {
                            if !closure.ty.beta_eq(e, Lvl(l.0 + 1 + i), &arg_ty, l)? {
                                return Err(Error::TyMismatch);
                            }
                            closure.apply(e, arg.eval(e, c)?)?
                        }
                        _ => return Err(Error::TyMismatch),
                    };
                }

                // Ensure that the constructor is fully applied.
                if let Val::Pi(_) = ctor {
                    return Err(Error::TyMismatch);
                }

                Ok(ctor)
            }
            Tm::OldInd { motive, cases, val } => {
                // Part 1: check that the motive is of the form `Πx1. ... Πxk.(F x1 ... xk) → U n`.

                let motive_uncurrified = motive.ty_internal(e, c, tc)?.uncurrify_pi(e, l)?;

                match motive_uncurrified.out {
                    Val::U(_) => {}
                    _ => return Err(Error::TyMismatch),
                }

                let fix_indexed_uncurrified = motive_uncurrified
                    .args
                    .last()
                    .ok_or(Error::TyMismatch)?
                    .uncurrify_app()?;

                let index_count = fix_indexed_uncurrified.args.len();
                if index_count != motive_uncurrified.args.len() - 1 {
                    return Err(Error::TyMismatch);
                }

                // This will fail if one of x1, ..., xk occurs in F.
                let fix = fix_indexed_uncurrified
                    .f
                    .reify(e, Lvl(l.0 + index_count))?
                    .unlift(0, index_count)?;

                let (fix_ty, fix_ctors) = match &fix_indexed_uncurrified.f {
                    Val::OldFix { ty, ctors } => (ty, ctors),
                    _ => return Err(Error::TyMismatch),
                };

                let fix_ty_uncurrified = fix_ty.uncurrify_pi(e, Lvl(l.0 + index_count))?;
                if fix_ty_uncurrified.args.len() != index_count {
                    return Err(Error::TyMismatch);
                }

                // Check that F is called with the right arguments.
                for (i, arg) in fix_ty_uncurrified.args.iter().enumerate() {
                    match arg {
                        Val::Var(k) if *k == Lvl(l.0 + i) => {}
                        _ => return Err(Error::TyMismatch),
                    }
                }

                // Part 2: check that the value to be inducted upon has the right type.

                let val_ty_uncurrified = val.ty_internal(e, c, tc)?.uncurrify_app()?;

                if val_ty_uncurrified.args.len() != index_count {
                    return Err(Error::TyMismatch);
                }

                if val_ty_uncurrified.f.reify(e, l)? != fix {
                    return Err(Error::TyMismatch);
                }

                // Part 3: check that the cases are well-typed.

                if cases.len() != fix_ctors.len() {
                    return Err(Error::TyMismatch);
                }

                let motive = motive.eval(e, c)?;
                let fix_val = fix.eval(e, c)?;

                for (i, (case, ctor)) in cases.iter().zip(fix_ctors.iter()).enumerate() {
                    // Part 3.1: construct the expected constructor parameters by filtering out the
                    // induction hypotheses.

                    let mut case_ty_l = Lvl(l.0);
                    let mut case_ty = case.ty_internal(e, c, tc)?;

                    let mut expected_ctor_params = Vec::new();
                    let mut out_ctor_args = Vec::new();

                    let mut prev_was_self = false;

                    while let Val::Pi(closure) = &case_ty {
                        if prev_was_self {
                            prev_was_self = false;

                            // Ignore the induction hypothesis.
                            case_ty = closure
                                .closure
                                .body
                                .unlift(0, 1)?
                                .eval(e, &closure.closure.c)?;
                        } else {
                            prev_was_self = {
                                let uncurrified = closure.ty.uncurrify_app()?;
                                uncurrified.f.reify(e, l).as_ref() == Ok(&fix)
                            };

                            expected_ctor_params.push(closure.ty.clone());
                            out_ctor_args.push(Val::Var(case_ty_l));

                            case_ty = closure.apply(e, Val::Var(Lvl(case_ty_l.0)))?;
                            case_ty_l.0 += 1;
                        }
                    }

                    if prev_was_self {
                        return Err(Error::TyMismatch);
                    }

                    // Part 3.2: compare the expected constructor parameters with the actual
                    // constructor parameters.

                    let ctor_uncurrified = ctor.apply(e, fix_val.clone())?.uncurrify_pi(e, l)?;

                    for (j, (expected, actual)) in expected_ctor_params
                        .iter()
                        .zip(ctor_uncurrified.args.iter())
                        .enumerate()
                    {
                        if !expected.beta_eq(e, Lvl(l.0 + j), actual, Lvl(l.0 + j))? {
                            return Err(Error::TyMismatch);
                        }
                    }

                    // Part 3.3: check that the case's return type is of the form `P (C x1 ... xk)`.

                    let expected_out = motive.apply(
                        e,
                        Val::OldCtor {
                            fix: Box::new(fix_val.clone()),
                            i,
                            args: out_ctor_args,
                        },
                    )?;

                    if !case_ty.beta_eq(e, case_ty_l, &expected_out, case_ty_l)? {
                        return Err(Error::TyMismatch);
                    }
                }

                motive.apply(e, val.eval(e, c)?)
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
            Tm::OldFix { ty, ctors } => {
                ty.lift(by);
                for ctor in ctors {
                    ctor.lift(by);
                }
            }
            Tm::OldCtor { fix, args, .. } => {
                fix.lift(by);
                for arg in args {
                    arg.lift(by);
                }
            }
            Tm::OldInd { motive, cases, val } => {
                motive.lift(by);
                for case in cases {
                    case.lift(by);
                }
                val.lift(by);
            }
        }
    }

    /// Subtracts `by` from the de Bruijn indices greater or equal to `k` in the lambda term.
    fn unlift(&self, k: usize, by: usize) -> Result<Tm, Error> {
        match self {
            Tm::Var(i) => {
                if i.0 < k {
                    Ok(Tm::Var(*i))
                } else {
                    Ok(Tm::Var(Ix(i.0.checked_sub(by).ok_or(Error::IxOverflow)?)))
                }
            }
            Tm::Abs(abs) => Ok(Tm::Abs(Box::new(Binding {
                bound_ty: abs.bound_ty.unlift(k, by)?,
                body: abs.body.unlift(k + 1, by)?,
            }))),
            Tm::App(m, n) => Ok(Tm::App(
                Box::new(m.unlift(k, by)?),
                Box::new(n.unlift(k, by)?),
            )),
            Tm::Pi(abs) => Ok(Tm::Pi(Box::new(Binding {
                bound_ty: abs.bound_ty.unlift(k, by)?,
                body: abs.body.unlift(k + 1, by)?,
            }))),
            Tm::U(n) => Ok(Tm::U(n.clone())),
            Tm::Inductive { .. } => todo!(),
            Tm::Ctor { .. } => todo!(),
            Tm::Induction { .. } => todo!(),
            Tm::OldFix { ty, ctors } => Ok(Tm::OldFix {
                ty: Box::new(ty.unlift(k, by)?),
                ctors: ctors
                    .iter()
                    .map(|ctor| ctor.unlift(k, by))
                    .collect::<Result<_, _>>()?,
            }),
            Tm::OldCtor { fix, i, args } => Ok(Tm::OldCtor {
                fix: Box::new(fix.unlift(k, by)?),
                i: *i,
                args: args
                    .iter()
                    .map(|arg| arg.unlift(k, by))
                    .collect::<Result<_, _>>()?,
            }),
            Tm::OldInd { motive, cases, val } => Ok(Tm::OldInd {
                motive: Box::new(motive.unlift(k, by)?),
                cases: cases
                    .iter()
                    .map(|case| case.unlift(k, by))
                    .collect::<Result<_, _>>()?,
                val: Box::new(val.unlift(k, by)?),
            }),
        }
    }
}

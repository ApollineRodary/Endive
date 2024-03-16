//! The Endive kernel.
//!
//! At the heart of Endive is the Endive kernel, which implements a variant of intuistionistic
//! type theory with inductive types, universes and universe level variables. Higher level
//! constructs are translated into the core language that the kernel understands, which is smaller
//! and therefore more amenable to formal reasoning. This separation follows what is known as the
//! de Bruijn criterion.

mod closure;
mod ctx;
mod global_env;
mod induction;
pub mod univ_lvl;

use closure::BindingClosure;
use ctx::{Ctx, TyCtx};
pub use global_env::*;
pub use induction::*;

use std::{ops::Neg, rc::Rc};

/// de Bruijn index.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub struct Ix(pub usize);

/// de Bruijn level.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
struct Lvl(usize);

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

/// Error type.
#[derive(PartialEq, Eq, Debug)]
pub enum Error {
    IxOverflow,
    TyMismatch,
}

impl Tm {
    /// Evaluates a lambda term to weak head normal form in the given local context.
    fn eval(&self, e: &GlobalEnv, c: &Rc<Ctx>) -> Result<Val, Error> {
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
            Tm::Inductive { .. } => todo!(),
            Tm::Ctor { .. } => todo!(),
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
    fn univ_lvl(
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

/// Lambda term in weak head normal form.
#[derive(Clone, Debug)]
enum Val {
    /// Variable.
    Var(Lvl),

    /// Lambda abstraction.
    Abs(Box<BindingClosure>),

    /// Application.
    App(Box<Val>, Box<Val>),

    /// Dependent product type.
    Pi(Box<BindingClosure>),

    /// Type universe.
    U(univ_lvl::Expr),

    /// Inductive type family.
    Inductive {
        /// Index of the inductive type family in the global environment.
        idx: usize,

        /// Arguments to the inductive type family.
        args: Vec<Val>,

        /// Indices of the inductive type.
        indices: Vec<Val>,
    },

    /// Constructor of an inductive type.
    Ctor {
        /// Index of the inductive type family in the global environment.
        inductive_idx: usize,

        /// Arguments to the inductive type family.
        inductive_args: Vec<Val>,

        /// Index of the constructor.
        ctor_idx: usize,

        /// Arguments to the constructor.
        ctor_args: Vec<Val>,
    },

    /// Inductive type family.
    OldFix {
        /// Type.
        ty: Box<Val>,

        /// Constructors.
        ctors: Vec<Val>,
    },

    /// The `i`-th constructor of the inductive type family.
    OldCtor {
        /// The inductive type family.
        fix: Box<Val>,

        /// Index of the constructor.
        i: usize,

        /// Arguments to the constructor.
        args: Vec<Val>,
    },

    /// Principle of induction.
    OldInd {
        /// Value on which to perform the induction.
        val: Box<Val>,

        /// Motive of the induction.
        motive: Box<Val>,

        /// Cases of the induction.
        cases: Vec<Val>,
    },
}

impl Val {
    /// Reifies a value into a normal form. Variables are reified into de Bruijn indices assuming
    /// current level `l`.
    fn reify(&self, e: &GlobalEnv, l: Lvl) -> Result<Tm, Error> {
        match self {
            Val::Var(k) => {
                let i = Ix(l.0.checked_sub(k.0 + 1).expect("de Bruijn level underflow"));
                Ok(Tm::Var(i))
            }
            Val::Abs(closure) => Ok(Tm::Abs(Box::new(closure.reify(e, l)?))),
            Val::App(n, m) => Ok(Tm::App(Box::new(n.reify(e, l)?), Box::new(m.reify(e, l)?))),
            Val::Pi(closure) => Ok(Tm::Pi(Box::new(closure.reify(e, l)?))),
            Val::U(n) => Ok(Tm::U(n.clone())),
            Val::Inductive { idx, args, indices } => Ok(Tm::Inductive {
                idx: *idx,
                args: args
                    .iter()
                    .map(|arg| arg.reify(e, l))
                    .collect::<Result<_, _>>()?,
                indices: indices
                    .iter()
                    .map(|index| index.reify(e, l))
                    .collect::<Result<_, _>>()?,
            }),
            Val::Ctor {
                inductive_idx,
                inductive_args,
                ctor_idx,
                ctor_args,
            } => Ok(Tm::Ctor {
                inductive_idx: *inductive_idx,
                inductive_args: inductive_args
                    .iter()
                    .map(|arg| arg.reify(e, l))
                    .collect::<Result<_, _>>()?,
                ctor_idx: *ctor_idx,
                ctor_args: ctor_args
                    .iter()
                    .map(|arg| arg.reify(e, l))
                    .collect::<Result<_, _>>()?,
            }),
            Val::OldFix { ty, ctors } => Ok(Tm::OldFix {
                ty: Box::new(ty.reify(e, l)?),
                ctors: ctors
                    .iter()
                    .map(|ctor| ctor.reify(e, l))
                    .collect::<Result<_, _>>()?,
            }),
            Val::OldCtor { fix, i, args } => Ok(Tm::OldCtor {
                fix: Box::new(fix.reify(e, l)?),
                i: *i,
                args: args
                    .iter()
                    .map(|arg| arg.reify(e, l))
                    .collect::<Result<_, _>>()?,
            }),
            Val::OldInd { motive, cases, val } => Ok(Tm::OldInd {
                motive: Box::new(motive.reify(e, l)?),
                cases: cases
                    .iter()
                    .map(|case| case.reify(e, l))
                    .collect::<Result<_, _>>()?,
                val: Box::new(val.reify(e, l)?),
            }),
        }
    }

    /// Applies the value to another value.
    fn apply(&self, e: &GlobalEnv, val: Val) -> Result<Val, Error> {
        match self {
            Val::Abs(closure) => closure.apply(e, val),
            _ => Ok(Val::App(Box::new(self.clone()), Box::new(val))),
        }
    }

    /// Applies the principle of induction to the value.
    fn induction(&self, e: &GlobalEnv, motive: Val, cases: Vec<Val>, l: Lvl) -> Result<Val, Error> {
        let Val::OldCtor { fix, i, args } = self else {
            return Ok(Val::OldInd {
                motive: Box::new(motive),
                cases,
                val: Box::new(self.clone()),
            });
        };
        let Val::OldFix { ty: _, ctors } = &**fix else {
            return Ok(Val::OldInd {
                motive: Box::new(motive),
                cases,
                val: Box::new(self.clone()),
            });
        };
        let Some(ctor) = ctors.get(*i) else {
            return Ok(Val::OldInd {
                motive: Box::new(motive),
                cases,
                val: Box::new(self.clone()),
            });
        };
        let Val::Abs(closure) = ctor else {
            return Ok(Val::OldInd {
                motive: Box::new(motive),
                cases,
                val: Box::new(self.clone()),
            });
        };
        let mut ctor = closure.apply(e, Val::Var(l))?;
        let Some(mut case) = cases.get(*i).cloned() else {
            return Ok(Val::OldInd {
                motive: Box::new(motive),
                cases,
                val: Box::new(self.clone()),
            });
        };
        let mut args = args.iter().enumerate();
        while let Val::Pi(closure) = &ctor {
            let Some((j, arg)) = args.next() else {
                return Ok(Val::OldInd {
                    motive: Box::new(motive),
                    cases,
                    val: Box::new(self.clone()),
                });
            };
            case = case.apply(e, arg.clone())?;
            if closure.ty.is_apply_of_var(l) {
                case = case.apply(e, arg.induction(e, motive.clone(), cases.clone(), l)?)?;
            }
            ctor = closure.apply(e, Val::Var(Lvl(l.0 + 1 + j)))?;
        }
        Ok(case)
    }

    /// Returns whether the value is a currified application of variable `Val::Var(l)`.
    fn is_apply_of_var(&self, l: Lvl) -> bool {
        match self {
            Val::App(m, _n) => m.is_apply_of_var(l),
            Val::Var(k) => *k == l,
            _ => false,
        }
    }

    /// Uncurrifies an application.
    fn uncurrify_app(&self) -> Result<Apps, Error> {
        let mut v = self.clone();
        let mut args = vec![];
        while let Val::App(m, n) = v {
            args.push(*n);
            v = *m;
        }
        args.reverse();
        Ok(Apps { f: v, args })
    }

    /// Uncurrifies chained dependent products.
    fn uncurrify_pi(&self, e: &GlobalEnv, l: Lvl) -> Result<Pis, Error> {
        let mut v = self.clone();
        let mut args = vec![];
        while let Val::Pi(closure) = v {
            args.push(closure.ty.clone());
            v = closure.apply(e, Val::Var(Lvl(l.0 + args.len())))?;
        }
        Ok(Pis { args, out: v })
    }

    /// Validates a constructor parameter.
    fn check_ctor_param(
        &self,
        e: &GlobalEnv,
        l: Lvl,
        fix_l: Lvl,
        fix_universe: &univ_lvl::Expr,
        fix_indices: usize,
        v: Variance,
    ) -> Result<(), Error> {
        match self {
            Val::Pi(closure) => {
                closure
                    .ty
                    .check_ctor_param(e, l, fix_l, fix_universe, fix_indices, -v)?;
                closure.apply(e, Val::Var(l))?.check_ctor_param(
                    e,
                    Lvl(l.0 + 1),
                    fix_l,
                    fix_universe,
                    fix_indices,
                    v,
                )?;
            }
            Val::U(n) => {
                if *n >= *fix_universe {
                    return Err(Error::TyMismatch);
                }
            }
            Val::Var(_) | Val::App(_, _) => {
                let uncurrified = self.uncurrify_app()?;
                let is_fix = match uncurrified.f {
                    Val::Var(k) => k == fix_l,
                    _ => false,
                };
                if is_fix {
                    if v != Variance::Covariant || uncurrified.args.len() != fix_indices {
                        return Err(Error::TyMismatch);
                    }
                } else {
                    for arg in uncurrified.args {
                        if arg.has_var(e, l, fix_l)? {
                            return Err(Error::TyMismatch);
                        }
                    }
                }
            }
            _ => return Err(Error::TyMismatch),
        };
        Ok(())
    }

    /// Returns whether the value contains `Val::Var(var_l)`.
    fn has_var(&self, e: &GlobalEnv, l: Lvl, var_l: Lvl) -> Result<bool, Error> {
        match self {
            Val::Var(k) => Ok(*k == var_l),
            Val::App(m, n) => Ok(m.has_var(e, l, var_l)? || n.has_var(e, l, var_l)?),
            Val::Abs(closure) => Ok(closure.ty.has_var(e, l, var_l)?
                || closure
                    .apply(e, Val::Var(l))?
                    .has_var(e, Lvl(l.0 + 1), var_l)?),
            Val::Pi(closure) => Ok(closure.ty.has_var(e, l, var_l)?
                || closure
                    .apply(e, Val::Var(l))?
                    .has_var(e, Lvl(l.0 + 1), var_l)?),
            Val::U(_) => Ok(false),
            Val::Inductive { idx, args, indices } => {
                let mut has_var = false;
                for arg in args {
                    has_var = has_var || arg.has_var(e, l, var_l)?;
                }
                for index in indices {
                    has_var = has_var || index.has_var(e, l, var_l)?;
                }
                Ok(has_var)
            }
            Val::Ctor {
                inductive_args,
                ctor_args,
                ..
            } => {
                let mut has_var = false;
                for arg in inductive_args {
                    has_var = has_var || arg.has_var(e, l, var_l)?;
                }
                for arg in ctor_args {
                    has_var = has_var || arg.has_var(e, l, var_l)?;
                }
                Ok(has_var)
            }
            Val::Induction { .. } => todo!(),
            Val::OldFix { ty, ctors } => {
                let mut has_var = ty.has_var(e, l, var_l)?;
                for ctor in ctors {
                    has_var = has_var || ctor.has_var(e, l, var_l)?;
                }
                Ok(has_var)
            }
            Val::OldCtor { fix, i: _, args } => {
                let mut has_var = fix.has_var(e, l, var_l)?;
                for arg in args {
                    has_var = has_var || arg.has_var(e, l, var_l)?;
                }
                Ok(has_var)
            }
            Val::OldInd { motive, cases, val } => {
                let mut has_var = motive.has_var(e, l, var_l)?;
                for case in cases {
                    has_var = has_var || case.has_var(e, l, var_l)?;
                }
                has_var = has_var || val.has_var(e, l, var_l)?;
                Ok(has_var)
            }
        }
    }

    /// Beta equivalence.
    pub(crate) fn beta_eq(
        &self,
        e: &GlobalEnv,
        l: Lvl,
        other: &Val,
        other_l: Lvl,
    ) -> Result<bool, Error> {
        match (self, other) {
            (Val::Var(i), Val::Var(j)) => Ok(l.0 + j.0 == other_l.0 + i.0),
            (Val::Abs(closure), Val::Abs(other_closure))
            | (Val::Pi(closure), Val::Pi(other_closure)) => {
                if !closure.ty.beta_eq(e, l, &other_closure.ty, other_l)? {
                    return Ok(false);
                }
                closure.apply(e, Val::Var(l))?.beta_eq(
                    e,
                    Lvl(l.0 + 1),
                    &other_closure.apply(e, Val::Var(other_l))?,
                    Lvl(other_l.0 + 1),
                )
            }
            (Val::App(m, n), Val::App(other_m, other_n)) => {
                if !m.beta_eq(e, l, other_m, other_l)? {
                    return Ok(false);
                }
                n.beta_eq(e, l, other_n, other_l)
            }
            (Val::U(n), Val::U(other_n)) => Ok(n == other_n),
            (
                Val::OldFix { ty, ctors },
                Val::OldFix {
                    ty: other_ty,
                    ctors: other_ctors,
                },
            ) => {
                if !ty.beta_eq(e, l, other_ty, other_l)? {
                    return Ok(false);
                }
                if ctors.len() != other_ctors.len() {
                    return Ok(false);
                }
                for (ctor, other_ctor) in ctors.iter().zip(other_ctors) {
                    if !ctor.beta_eq(e, l, other_ctor, other_l)? {
                        return Ok(false);
                    }
                }
                Ok(true)
            }
            (
                Val::OldCtor { fix, i, args },
                Val::OldCtor {
                    fix: other_fix,
                    i: other_i,
                    args: other_args,
                },
            ) => {
                if !fix.beta_eq(e, l, other_fix, other_l)? {
                    return Ok(false);
                }
                if i != other_i {
                    return Ok(false);
                }
                if args.len() != other_args.len() {
                    return Ok(false);
                }
                for (arg, other_arg) in args.iter().zip(other_args) {
                    if !arg.beta_eq(e, l, other_arg, other_l)? {
                        return Ok(false);
                    }
                }
                Ok(true)
            }
            (
                Val::OldInd { motive, cases, val },
                Val::OldInd {
                    motive: other_motive,
                    cases: other_cases,
                    val: other_val,
                },
            ) => {
                if !motive.beta_eq(e, l, other_motive, other_l)? {
                    return Ok(false);
                }
                if cases.len() != other_cases.len() {
                    return Ok(false);
                }
                for (case, other_case) in cases.iter().zip(other_cases) {
                    if !case.beta_eq(e, l, other_case, other_l)? {
                        return Ok(false);
                    }
                }
                val.beta_eq(e, l, other_val, other_l)
            }
            _ => Ok(false),
        }
    }
}

/// Uncurrified applications.
struct Apps {
    f: Val,
    args: Vec<Val>,
}

/// Uncurrified dependent products.
struct Pis {
    args: Vec<Val>,
    out: Val,
}

/// Variance.
#[derive(Clone, Copy, PartialEq, Eq)]
enum Variance {
    Covariant,
    Contravariant,
}

impl Neg for Variance {
    type Output = Self;

    fn neg(self) -> Self::Output {
        match self {
            Variance::Covariant => Variance::Contravariant,
            Variance::Contravariant => Variance::Covariant,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn beta_eq() {
        let e = GlobalEnv::new();

        // (λx.x) = (λx.x)
        let id = Tm::Abs(Box::new(Binding {
            bound_ty: Tm::U(univ_lvl::Var(0).into()),
            body: Tm::Var(Ix(0)),
        }));
        assert_eq!(id.beta_eq(&e, &id), Ok(true));

        // (λx.x) (λx.x) = x
        let id_id = Tm::App(Box::new(id.clone()), Box::new(id.clone()));
        assert_eq!(id_id.beta_eq(&e, &id), Ok(true));

        // (λx.(λy.y) x) = (λx.x)
        let id_eta = Tm::Abs(Box::new(Binding {
            bound_ty: Tm::U(univ_lvl::Var(0).into()),
            body: Tm::App(Box::new(id.clone()), Box::new(Tm::Var(Ix(0)))),
        }));
        assert_eq!(id_eta.beta_eq(&e, &id), Ok(true));
    }

    #[test]
    fn induction() {
        let e = GlobalEnv::new();

        // ℕ := μX.[X; X → X]
        let n = Tm::OldFix {
            ty: Box::new(Tm::U(univ_lvl::Var(0).into())),
            ctors: vec![
                Tm::Abs(Box::new(Binding {
                    bound_ty: Tm::U(univ_lvl::Var(0).into()),
                    body: Tm::Var(Ix(0)),
                })),
                Tm::Abs(Box::new(Binding {
                    bound_ty: Tm::U(univ_lvl::Var(0).into()),
                    body: Tm::Pi(Box::new(Binding {
                        bound_ty: Tm::Var(Ix(0)),
                        body: Tm::Var(Ix(1)),
                    })),
                })),
            ],
        };

        // 2 : ℕ
        let two = Tm::OldCtor {
            fix: Box::new(n.clone()),
            i: 1,
            args: vec![Tm::OldCtor {
                fix: Box::new(n.clone()),
                i: 1,
                args: vec![Tm::OldCtor {
                    fix: Box::new(n.clone()),
                    i: 0,
                    args: vec![],
                }],
            }],
        };

        // 3 : ℕ
        let three = Tm::OldCtor {
            fix: Box::new(n.clone()),
            i: 1,
            args: vec![two.clone()],
        };

        // 5 : ℕ
        let five = Tm::OldCtor {
            fix: Box::new(n.clone()),
            i: 1,
            args: vec![Tm::OldCtor {
                fix: Box::new(n.clone()),
                i: 1,
                args: vec![three.clone()],
            }],
        };

        // add : ℕ → ℕ → ℕ
        let add = Tm::Abs(Box::new(Binding {
            bound_ty: n.clone(),
            body: Tm::Abs(Box::new(Binding {
                bound_ty: n.clone(),
                body: Tm::OldInd {
                    motive: Box::new(Tm::Abs(Box::new(Binding {
                        bound_ty: n.clone(),
                        body: n.clone(),
                    }))),
                    cases: vec![
                        Tm::Var(Ix(1)),
                        Tm::Abs(Box::new(Binding {
                            bound_ty: n.clone(),
                            body: Tm::Abs(Box::new(Binding {
                                bound_ty: n.clone(),
                                body: Tm::OldCtor {
                                    fix: Box::new(n.clone()),
                                    i: 1,
                                    args: vec![Tm::Var(Ix(0))],
                                },
                            })),
                        })),
                    ],
                    val: Box::new(Tm::Var(Ix(0))),
                },
            })),
        }));

        // add 2 3 = 5
        let add_two_three = Tm::App(
            Box::new(Tm::App(Box::new(add.clone()), Box::new(two.clone()))),
            Box::new(three.clone()),
        );
        assert_eq!(
            add_two_three
                .eval(&e, &Default::default())
                .and_then(|v| v.reify(&e, Lvl(0))),
            Ok(five)
        );
    }

    #[test]
    fn ty() {
        let e = GlobalEnv::new();

        // λx.x : U 0 → U 0
        let id = Tm::Abs(Box::new(Binding {
            bound_ty: Tm::U(univ_lvl::Var(0).into()),
            body: Tm::Var(Ix(0)),
        }));
        let id_ty = Tm::Pi(Box::new(Binding {
            bound_ty: Tm::U(univ_lvl::Var(0).into()),
            body: Tm::U(univ_lvl::Var(0).into()),
        }));
        assert_eq!(id.ty(&e), Ok(id_ty.clone()));

        // (λx.x) (λx.x) : U 0 → U 0
        let n = Tm::Abs(Box::new(Binding {
            bound_ty: id_ty.clone(),
            body: Tm::Var(Ix(0)),
        }));
        let id_id = Tm::App(Box::new(n.clone()), Box::new(id.clone()));
        assert_eq!(id_id.ty(&e), Ok(id_ty));

        // Πx.x : U 1
        let n = Tm::Pi(Box::new(Binding {
            bound_ty: Tm::U(univ_lvl::Var(0).into()),
            body: Tm::Var(Ix(0)),
        }));
        let n_ty = Tm::U(univ_lvl::Expr::from(univ_lvl::Var(0)) + 1);
        assert_eq!(n.ty(&e), Ok(n_ty));
    }

    #[test]
    fn ty_fix() {
        let e = GlobalEnv::new();

        // ℕ := μX.[X; X → X]
        let n = Tm::OldFix {
            ty: Box::new(Tm::U(univ_lvl::Var(0).into())),
            ctors: vec![
                Tm::Abs(Box::new(Binding {
                    bound_ty: Tm::U(univ_lvl::Var(0).into()),
                    body: Tm::Var(Ix(0)),
                })),
                Tm::Abs(Box::new(Binding {
                    bound_ty: Tm::U(univ_lvl::Var(0).into()),
                    body: Tm::Pi(Box::new(Binding {
                        bound_ty: Tm::Var(Ix(0)),
                        body: Tm::Var(Ix(1)),
                    })),
                })),
            ],
        };

        // ℕ : U 0
        assert_eq!(n.ty(&e), Ok(Tm::U(univ_lvl::Var(0).into())));

        // S 0 : ℕ
        let one = Tm::OldCtor {
            fix: Box::new(n.clone()),
            i: 1,
            args: vec![Tm::OldCtor {
                fix: Box::new(n.clone()),
                i: 0,
                args: vec![],
            }],
        };
        assert_eq!(one.ty(&e), Ok(n.clone()));
    }

    #[test]
    fn ty_ind() {
        let e = GlobalEnv::new();

        // ℕ := μX.[X; X → X]
        let n = Tm::OldFix {
            ty: Box::new(Tm::U(univ_lvl::Var(0).into())),
            ctors: vec![
                Tm::Abs(Box::new(Binding {
                    bound_ty: Tm::U(univ_lvl::Var(0).into()),
                    body: Tm::Var(Ix(0)),
                })),
                Tm::Abs(Box::new(Binding {
                    bound_ty: Tm::U(univ_lvl::Var(0).into()),
                    body: Tm::Pi(Box::new(Binding {
                        bound_ty: Tm::Var(Ix(0)),
                        body: Tm::Var(Ix(1)),
                    })),
                })),
            ],
        };

        // add : ℕ → ℕ → ℕ
        let add = Tm::Abs(Box::new(Binding {
            bound_ty: n.clone(),
            body: Tm::Abs(Box::new(Binding {
                bound_ty: n.clone(),
                body: Tm::OldInd {
                    motive: Box::new(Tm::Abs(Box::new(Binding {
                        bound_ty: n.clone(),
                        body: n.clone(),
                    }))),
                    cases: vec![
                        Tm::Var(Ix(1)),
                        Tm::Abs(Box::new(Binding {
                            bound_ty: n.clone(),
                            body: Tm::Abs(Box::new(Binding {
                                bound_ty: n.clone(),
                                body: Tm::OldCtor {
                                    fix: Box::new(n.clone()),
                                    i: 1,
                                    args: vec![Tm::Var(Ix(0))],
                                },
                            })),
                        })),
                    ],
                    val: Box::new(Tm::Var(Ix(0))),
                },
            })),
        }));

        // add : ℕ → ℕ → ℕ
        assert_eq!(
            add.ty(&e),
            Ok(Tm::Pi(Box::new(Binding {
                bound_ty: n.clone(),
                body: Tm::Pi(Box::new(Binding {
                    bound_ty: n.clone(),
                    body: n.clone(),
                })),
            })))
        );
    }

    #[test]
    fn hypothetical_syllogism() {
        let e = GlobalEnv::new();

        // ΠP.ΠQ.ΠR.(P -> Q) -> (Q -> R) -> P -> R
        let statement = Tm::Pi(Box::new(Binding {
            bound_ty: Tm::U(univ_lvl::Expr::default()),
            body: Tm::Pi(Box::new(Binding {
                bound_ty: Tm::U(univ_lvl::Expr::default()),
                body: Tm::Pi(Box::new(Binding {
                    bound_ty: Tm::U(univ_lvl::Expr::default()),
                    body: Tm::Pi(Box::new(Binding {
                        bound_ty: Tm::Pi(Box::new(Binding {
                            bound_ty: Tm::Var(Ix(2)),
                            body: Tm::Var(Ix(2)),
                        })),
                        body: Tm::Pi(Box::new(Binding {
                            bound_ty: Tm::Pi(Box::new(Binding {
                                bound_ty: Tm::Var(Ix(2)),
                                body: Tm::Var(Ix(2)),
                            })),
                            body: Tm::Pi(Box::new(Binding {
                                bound_ty: Tm::Var(Ix(4)),
                                body: Tm::Var(Ix(3)),
                            })),
                        })),
                    })),
                })),
            })),
        }));

        // λP.λQ.λR.λpq:P -> Q.λqr:Q -> R.λp:P.qr (pq p)
        let proof = Tm::Abs(Box::new(Binding {
            bound_ty: Tm::U(univ_lvl::Expr::default()),
            body: Tm::Abs(Box::new(Binding {
                bound_ty: Tm::U(univ_lvl::Expr::default()),
                body: Tm::Abs(Box::new(Binding {
                    bound_ty: Tm::U(univ_lvl::Expr::default()),
                    body: Tm::Abs(Box::new(Binding {
                        bound_ty: Tm::Pi(Box::new(Binding {
                            bound_ty: Tm::Var(Ix(2)),
                            body: Tm::Var(Ix(2)),
                        })),
                        body: Tm::Abs(Box::new(Binding {
                            bound_ty: Tm::Pi(Box::new(Binding {
                                bound_ty: Tm::Var(Ix(2)),
                                body: Tm::Var(Ix(2)),
                            })),
                            body: Tm::Abs(Box::new(Binding {
                                bound_ty: Tm::Var(Ix(4)),
                                body: Tm::App(
                                    Box::new(Tm::Var(Ix(1))),
                                    Box::new(Tm::App(
                                        Box::new(Tm::Var(Ix(2))),
                                        Box::new(Tm::Var(Ix(0))),
                                    )),
                                ),
                            })),
                        })),
                    })),
                })),
            })),
        }));

        assert_eq!(proof.ty(&e).unwrap().beta_eq(&e, &statement), Ok(true));
    }
}

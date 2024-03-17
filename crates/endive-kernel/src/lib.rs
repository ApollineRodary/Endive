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
mod tm;
pub mod univ_lvl;

use closure::{BindingClosure, Closure};
use ctx::{Ctx, TyCtx};
pub use global_env::*;
pub use induction::*;
pub use tm::*;

use std::ops::Neg;

/// de Bruijn level.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
struct Lvl(usize);

/// Error type.
#[derive(PartialEq, Eq, Debug)]
pub enum Error {
    IxOverflow,
    TyMismatch,
    InductiveOutOfBound,
    CtorOutOfBound,
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

    /// Principle of induction.
    Induction {
        /// Index of the inductive type family in the global environment.
        inductive_idx: usize,

        /// Arguments to the inductive type family.
        inductive_args: Vec<Val>,

        /// Motive of the induction.
        motive: Box<Closure>,

        /// Cases of the induction.
        cases: Vec<CaseVal>,

        /// Value on which to perform the induction.
        val: Box<Val>,
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
            Val::Induction {
                inductive_idx,
                inductive_args,
                motive,
                cases,
                val,
            } => Ok(Tm::Induction {
                inductive_idx: *inductive_idx,
                inductive_args: inductive_args
                    .iter()
                    .map(|arg| arg.reify(e, l))
                    .collect::<Result<_, _>>()?,
                motive: Box::new(
                    motive
                        .body
                        .eval(e, &motive.c.push(Val::Var(l)))?
                        .reify(e, Lvl(l.0 + 1))?,
                ),
                cases: cases
                    .iter()
                    .map(|case| match case {
                        CaseVal::Closure { param_count, body } => {
                            let mut c = body.c.clone();
                            for _ in 0..param_count.get() {
                                c = Ctx::push(&c, Val::Var(Lvl(c.len())));
                            }
                            Ok(Case {
                                param_count: param_count.get(),
                                body: body.body.eval(e, &c)?.reify(e, Lvl(c.len()))?,
                            })
                        }
                        CaseVal::Constant(val) => Ok(Case {
                            param_count: 0,
                            body: val.reify(e, l)?,
                        }),
                    })
                    .collect::<Result<_, _>>()?,
                val: Box::new(val.reify(e, l)?),
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
            Val::Inductive { args, indices, .. } => {
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

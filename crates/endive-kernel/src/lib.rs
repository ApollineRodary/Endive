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
mod val;

use closure::BindingClosure;
use ctx::{Ctx, TyCtx};
pub use global_env::*;
pub use induction::*;
pub use tm::*;

/// Error type.
#[derive(PartialEq, Eq, Debug)]
pub enum Error {
    IxOverflow,
    TyMismatch,
    InductiveOutOfBound,
    CtorOutOfBound,
}

#[cfg(test)]
mod tests {
    use crate::val::Lvl;

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

use std::ops::Neg;

use crate::{
    closure::{BindingClosure, Closure},
    ctx::Ctx,
    univ_lvl, Case, CaseVal, Error, GlobalEnv, Ix, Tm,
};

/// de Bruijn level.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub(crate) struct Lvl(pub(crate) usize);

/// Lambda term in weak head normal form.
#[derive(Clone, Debug)]
pub(crate) enum Val {
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
}

impl Val {
    /// Reifies a value into a normal form. Variables are reified into de Bruijn indices assuming
    /// current level `l`.
    pub(crate) fn reify(&self, e: &GlobalEnv, l: Lvl) -> Result<Tm, Error> {
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
                Val::Inductive { idx, args, indices },
                Val::Inductive {
                    idx: other_idx,
                    args: other_args,
                    indices: other_indices,
                },
            ) => {
                if idx != other_idx {
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
                if indices.len() != other_indices.len() {
                    return Ok(false);
                }
                for (index, other_index) in indices.iter().zip(other_indices) {
                    if !index.beta_eq(e, l, other_index, other_l)? {
                        return Ok(false);
                    }
                }
                Ok(true)
            }
            (
                Val::Ctor {
                    inductive_idx,
                    inductive_args,
                    ctor_idx,
                    ctor_args,
                },
                Val::Ctor {
                    inductive_idx: other_inductive_idx,
                    inductive_args: other_inductive_args,
                    ctor_idx: other_ctor_idx,
                    ctor_args: other_ctor_args,
                },
            ) => {
                if inductive_idx != other_inductive_idx {
                    return Ok(false);
                }
                if ctor_idx != other_ctor_idx {
                    return Ok(false);
                }
                if inductive_args.len() != other_inductive_args.len() {
                    return Ok(false);
                }
                for (arg, other_arg) in inductive_args.iter().zip(other_inductive_args) {
                    if !arg.beta_eq(e, l, other_arg, other_l)? {
                        return Ok(false);
                    }
                }
                if ctor_args.len() != other_ctor_args.len() {
                    return Ok(false);
                }
                for (arg, other_arg) in ctor_args.iter().zip(other_ctor_args) {
                    if !arg.beta_eq(e, l, other_arg, other_l)? {
                        return Ok(false);
                    }
                }
                Ok(true)
            }
            (
                Val::Induction {
                    inductive_idx,
                    inductive_args,
                    motive,
                    cases,
                    val,
                },
                Val::Induction {
                    inductive_idx: other_inductive_idx,
                    inductive_args: other_inductive_args,
                    motive: other_motive,
                    cases: other_cases,
                    val: other_val,
                },
            ) => {
                if inductive_idx != other_inductive_idx
                    || inductive_args.len() != other_inductive_args.len()
                    || cases.len() != other_cases.len()
                {
                    return Ok(false);
                }

                for (arg, other_arg) in inductive_args.iter().zip(other_inductive_args) {
                    if !arg.beta_eq(e, l, other_arg, other_l)? {
                        return Ok(false);
                    }
                }

                let inductive = e
                    .inductives
                    .get(*inductive_idx)
                    .ok_or(Error::InductiveOutOfBound)?;

                let mut motive_c = motive.c.clone();
                let mut motive_l = Lvl(motive_c.len());

                let motive_param_count = inductive.indices.0.len() + 1;
                for _ in 0..motive_param_count {
                    motive_c = motive_c.push(Val::Var(motive_l));
                    motive_l.0 += 1;
                }

                if !motive.body.eval(e, &motive_c)?.beta_eq(
                    e,
                    motive_l,
                    &other_motive.body.eval(e, &motive_c)?,
                    motive_l,
                )? {
                    return Ok(false);
                }

                for (case, other_case) in cases.iter().zip(other_cases) {
                    match (case, other_case) {
                        (CaseVal::Constant(val), CaseVal::Constant(other_val)) => {
                            if !val.beta_eq(e, l, other_val, other_l)? {
                                return Ok(false);
                            }
                        }
                        (
                            CaseVal::Closure { param_count, body },
                            CaseVal::Closure {
                                param_count: other_param_count,
                                body: other_body,
                            },
                        ) => {
                            if param_count != other_param_count {
                                return Ok(false);
                            }

                            let mut case_c = body.c.clone();
                            let mut case_l = Lvl(case_c.len());

                            for _ in 0..param_count.get() {
                                case_c = case_c.push(Val::Var(case_l));
                                case_l.0 += 1;
                            }

                            if !body.body.eval(e, &case_c)?.beta_eq(
                                e,
                                case_l,
                                &other_body.body.eval(e, &case_c)?,
                                case_l,
                            )? {
                                return Ok(false);
                            }
                        }
                        _ => return Ok(false),
                    }
                }

                val.beta_eq(e, l, other_val, other_l)
            }
            _ => Ok(false),
        }
    }
}

/// Variance.
#[derive(Clone, Copy, PartialEq, Eq)]
pub(crate) enum Variance {
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

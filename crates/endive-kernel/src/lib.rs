//! The Endive kernel.
//!
//! At the heart of Endive is the Endive kernel, which implements a variant of intuistionistic
//! type theory with inductive types, universes and universe level variables. Higher level
//! constructs are translated into the core language that the kernel understands, which is smaller
//! and therefore more amenable to formal reasoning. This separation follows what is known as the
//! de Bruijn criterion.

mod induction;
pub mod univ_lvl;

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
    fn eval(&self, c: &Rc<Ctx>) -> Result<Closure, Error> {
        Ok(Closure {
            ty: self.bound_ty.eval(c)?,
            body: self.body.clone(),
            c: c.clone(),
        })
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
    Fix {
        /// Type.
        ty: Box<Tm>,

        /// Constructors.
        ctors: Vec<Tm>,
    },

    /// The `i`-th constructor of the inductive type family.
    Ctor {
        /// The inductive type family.
        fix: Box<Tm>,

        /// Index of the constructor.
        i: usize,

        /// Arguments to the constructor.
        args: Vec<Tm>,
    },

    /// Principle of induction.
    Ind {
        /// Value on which to perform the induction.
        val: Box<Tm>,

        /// Motive of the induction.
        motive: Box<Tm>,

        /// Cases of the induction.
        cases: Vec<Tm>,
    },
}

/// Local context.
///
/// It is a linked list of values where the head is the value of the variable with the innermost
/// binder.
#[derive(Debug)]
enum Ctx {
    Nil,
    Cons(Val, Rc<Ctx>),
}

impl Ctx {
    /// Returns the `i`-th value in the local context.
    fn get(&self, i: Ix) -> Option<&Val> {
        match self {
            Ctx::Nil => None,
            Ctx::Cons(val, c) => {
                if i.0 == 0 {
                    Some(val)
                } else {
                    c.get(Ix(i.0 - 1))
                }
            }
        }
    }

    /// Returns the length of the local context.
    fn len(&self) -> usize {
        match self {
            Ctx::Nil => 0,
            Ctx::Cons(_, c) => 1 + c.len(),
        }
    }

    /// Pushes a value to the local context.
    fn push(self: &Rc<Self>, val: Val) -> Rc<Self> {
        Rc::new(Ctx::Cons(val, self.clone()))
    }
}

impl Default for Ctx {
    fn default() -> Self {
        Ctx::Nil
    }
}

/// Local typing context.
///
/// It is a linked list of values where the head is the type of the variable with the innermost
/// binder.
type TyCtx = Ctx;

/// Error type.
#[derive(PartialEq, Eq, Debug)]
pub enum Error {
    IxOverflow,
    TyMismatch,
}

impl Tm {
    /// Evaluates a lambda term to weak head normal form in the given local context.
    fn eval(&self, c: &Rc<Ctx>) -> Result<Val, Error> {
        match self {
            Tm::Var(i) => c.get(*i).ok_or(Error::IxOverflow).cloned(),
            Tm::Abs(abs) => Ok(Val::Abs(Box::new(abs.eval(c)?))),
            Tm::App(n, m) => {
                let n = n.eval(c)?;
                let m = m.eval(c)?;
                match n {
                    Val::Abs(closure) => closure.apply(m),
                    _ => Ok(Val::App(Box::new(n), Box::new(m))),
                }
            }
            Tm::Pi(abs) => Ok(Val::Pi(Box::new(abs.eval(c)?))),
            Tm::U(n) => Ok(Val::U(n.clone())),
            Tm::Fix { ty, ctors } => Ok(Val::Fix {
                ty: ty.eval(c)?.into(),
                ctors: ctors
                    .iter()
                    .map(|ctor| ctor.eval(c))
                    .collect::<Result<_, _>>()?,
            }),
            Tm::Ctor { fix, i, args } => Ok(Val::Ctor {
                fix: Box::new(fix.eval(c)?),
                i: *i,
                args: args
                    .iter()
                    .map(|arg| arg.eval(c))
                    .collect::<Result<_, _>>()?,
            }),
            Tm::Ind { motive, cases, val } => {
                let motive = motive.eval(c)?;
                let cases = cases
                    .iter()
                    .map(|case| case.eval(c))
                    .collect::<Result<_, _>>()?;
                let val = val.eval(c)?;
                val.induction(motive, cases, Lvl(c.len()))
            }
        }
    }

    /// Beta normalizes the lambda term.
    pub fn normalize(&self) -> Result<Tm, Error> {
        // Normalization by Evaluation
        self.eval(&Default::default())?.reify(Lvl(0))
    }

    /// Beta equivalence.
    pub fn beta_eq(&self, other: &Tm) -> Result<bool, Error> {
        Ok(self.normalize()? == other.normalize()?)
    }

    /// Infers the type of the lambda term using rules from Pure Type Systems.
    pub fn ty(&self) -> Result<Tm, Error> {
        self.ty_internal(&Default::default(), &Default::default())?
            .reify(Lvl(0))
    }

    /// Infers the type of the lambda term using rules from Pure Type Systems.
    ///
    /// Unlike [`ty`] which is the public interface, this method takes a local context and a typing
    /// local context as arguments and returns a value corresponding to the inferred type. This is
    /// useful for inferring the type of a subterm in a larger term.
    fn ty_internal(&self, c: &Rc<Ctx>, tc: &Rc<TyCtx>) -> Result<Val, Error> {
        let l = Lvl(c.len());

        match self {
            Tm::Var(i) => tc.get(*i).ok_or(Error::IxOverflow).cloned(),
            Tm::Abs(abs) => {
                // Check that the type of the bound variable is a type.
                abs.bound_ty.univ_lvl(c, tc)?;

                let ty = abs.bound_ty.clone().eval(c)?;

                let body_ty = abs
                    .body
                    .ty_internal(&c.push(Val::Var(l)), &tc.push(ty.clone()))?;

                Ok(Val::Pi(Box::new(Closure {
                    ty,
                    body: body_ty.reify(Lvl(l.0 + 1))?,
                    c: c.clone(),
                })))
            }
            Tm::App(n, m) => match n.ty_internal(c, tc)? {
                Val::Pi(closure) => {
                    let m_ty = m.ty_internal(c, tc)?.reify(l);
                    let param_ty = closure.ty.reify(l);
                    if m_ty == param_ty {
                        Ok(closure.body.eval(&closure.c.push(m.clone().eval(c)?))?)
                    } else {
                        Err(Error::TyMismatch)
                    }
                }
                _ => Err(Error::TyMismatch),
            },
            Tm::Pi(abs) => {
                let ty_u = abs.bound_ty.univ_lvl(c, tc)?;
                let ty = abs.bound_ty.clone().eval(c)?;

                let body_u = abs.body.univ_lvl(&c.push(Val::Var(l)), &tc.push(ty))?;

                Ok(Val::U(ty_u.max(&body_u)))
            }
            Tm::U(u) => Ok(Val::U(u.clone() + 1)),
            Tm::Fix { ty, ctors } => {
                ty.ty_internal(c, tc)?;

                let ty = ty.clone().eval(c)?;
                let uncurrified = ty.uncurrify_pi(l)?;
                let universe = match uncurrified.out {
                    Val::U(n) => n,
                    _ => return Err(Error::TyMismatch),
                };

                // Check that the indices belong to a universe strictly smaller than the universe
                // of the inductive type family.
                for index in &uncurrified.args {
                    if index.reify(l)?.univ_lvl(c, tc)? >= universe {
                        return Err(Error::TyMismatch);
                    }
                }

                for ctor in ctors {
                    match ctor.ty_internal(c, tc)? {
                        Val::Pi(closure) if closure.ty.reify(l) == ty.reify(l) => {}
                        _ => return Err(Error::TyMismatch),
                    }

                    let ctor_uncurrified = ctor
                        .eval(c)?
                        .apply(Val::Var(l))?
                        .uncurrify_pi(Lvl(l.0 + 1))?;

                    for (i, arg) in ctor_uncurrified.args.iter().enumerate() {
                        arg.check_ctor_param(
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
            Tm::Ctor { fix, i, args } => {
                fix.ty_internal(c, tc)?;

                let mut ctor = match fix.eval(c)? {
                    Val::Fix { ty, ctors } => ctors
                        .get(*i)
                        .cloned()
                        .ok_or(Error::TyMismatch)?
                        .apply(Val::Fix { ty, ctors })?,
                    _ => return Err(Error::TyMismatch),
                };

                // Check that the constructor is called with the right arguments.
                for (i, arg) in args.iter().enumerate() {
                    let arg_ty = arg.ty_internal(c, tc)?;
                    ctor = match &ctor {
                        Val::Pi(closure) => {
                            if closure.ty.reify(Lvl(l.0 + 1 + i))? != arg_ty.reify(l)? {
                                return Err(Error::TyMismatch);
                            }
                            closure.apply(arg.eval(c)?)?
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
            Tm::Ind { motive, cases, val } => {
                // Part 1: check that the motive is of the form `Πx1. ... Πxk.(F x1 ... xk) → U n`.

                let motive_uncurrified = motive.ty_internal(c, tc)?.uncurrify_pi(l)?;

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
                    .reify(Lvl(l.0 + index_count))?
                    .unlift(0, index_count)?;

                let (fix_ty, fix_ctors) = match &fix_indexed_uncurrified.f {
                    Val::Fix { ty, ctors } => (ty, ctors),
                    _ => return Err(Error::TyMismatch),
                };

                let fix_ty_uncurrified = fix_ty.uncurrify_pi(Lvl(l.0 + index_count))?;
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

                let val_ty_uncurrified = val.ty_internal(c, tc)?.uncurrify_app()?;

                if val_ty_uncurrified.args.len() != index_count {
                    return Err(Error::TyMismatch);
                }

                if val_ty_uncurrified.f.reify(l)? != fix {
                    return Err(Error::TyMismatch);
                }

                // Part 3: check that the cases are well-typed.

                if cases.len() != fix_ctors.len() {
                    return Err(Error::TyMismatch);
                }

                let motive = motive.eval(c)?;
                let fix_val = fix.eval(c)?;

                for (i, (case, ctor)) in cases.iter().zip(fix_ctors.iter()).enumerate() {
                    // Part 3.1: construct the expected constructor parameters by filtering out the
                    // induction hypotheses.

                    let mut case_ty_l = Lvl(l.0);
                    let mut case_ty = case.ty_internal(c, tc)?;

                    let mut expected_ctor_params = Vec::new();
                    let mut out_ctor_args = Vec::new();

                    let mut prev_was_self = false;

                    while let Val::Pi(closure) = &case_ty {
                        if prev_was_self {
                            prev_was_self = false;

                            // Ignore the induction hypothesis.
                            case_ty = closure.body.unlift(0, 1)?.eval(&closure.c)?;
                        } else {
                            prev_was_self = {
                                let uncurrified = closure.ty.uncurrify_app()?;
                                uncurrified.f.reify(l).as_ref() == Ok(&fix)
                            };

                            expected_ctor_params.push(closure.ty.clone());
                            out_ctor_args.push(Val::Var(case_ty_l));

                            case_ty = closure.apply(Val::Var(Lvl(case_ty_l.0)))?;
                            case_ty_l.0 += 1;
                        }
                    }

                    if prev_was_self {
                        return Err(Error::TyMismatch);
                    }

                    // Part 3.2: compare the expected constructor parameters with the actual
                    // constructor parameters.

                    let ctor_uncurrified = ctor.apply(fix_val.clone())?.uncurrify_pi(l)?;

                    for (j, (expected, actual)) in expected_ctor_params
                        .iter()
                        .zip(ctor_uncurrified.args.iter())
                        .enumerate()
                    {
                        if expected.reify(Lvl(l.0 + j))? != actual.reify(Lvl(l.0 + j))? {
                            return Err(Error::TyMismatch);
                        }
                    }

                    // Part 3.3: check that the case's return type is of the form `P (C x1 ... xk)`.

                    let expected_out = motive.apply(Val::Ctor {
                        fix: Box::new(fix_val.clone()),
                        i,
                        args: out_ctor_args,
                    })?;

                    if case_ty.reify(case_ty_l) != expected_out.reify(case_ty_l) {
                        return Err(Error::TyMismatch);
                    }
                }

                motive.apply(val.eval(c)?)
            }
        }
    }

    /// Computes the level of the universe to which the lambda term belongs.
    fn univ_lvl(&self, c: &Rc<Ctx>, tc: &Rc<TyCtx>) -> Result<univ_lvl::Expr, Error> {
        match self.ty_internal(c, tc)? {
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
            Tm::Fix { ty, ctors } => Ok(Tm::Fix {
                ty: Box::new(ty.unlift(k, by)?),
                ctors: ctors
                    .iter()
                    .map(|ctor| ctor.unlift(k, by))
                    .collect::<Result<_, _>>()?,
            }),
            Tm::Ctor { fix, i, args } => Ok(Tm::Ctor {
                fix: Box::new(fix.unlift(k, by)?),
                i: *i,
                args: args
                    .iter()
                    .map(|arg| arg.unlift(k, by))
                    .collect::<Result<_, _>>()?,
            }),
            Tm::Ind { motive, cases, val } => Ok(Tm::Ind {
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

/// Lambda abstraction or dependent product type with a local context.
#[derive(Clone, Debug)]
struct Closure {
    pub ty: Val,
    pub body: Tm,
    pub c: Rc<Ctx>,
}

impl Closure {
    /// Applies the closure to a value.
    fn apply(&self, val: Val) -> Result<Val, Error> {
        self.body.eval(&self.c.push(val))
    }

    /// Reifies the closure into an abstraction in normal form. Variables are reified into de
    /// Bruijn indices assuming current level `l`.
    fn reify(&self, l: Lvl) -> Result<Binding, Error> {
        Ok(Binding {
            bound_ty: self.ty.reify(l)?,
            body: self.apply(Val::Var(l))?.reify(Lvl(l.0 + 1))?,
        })
    }
}

/// Lambda term in weak head normal form.
#[derive(Clone, Debug)]
enum Val {
    /// Variable.
    Var(Lvl),

    /// Lambda abstraction.
    Abs(Box<Closure>),

    /// Application.
    App(Box<Val>, Box<Val>),

    /// Dependent product type.
    Pi(Box<Closure>),

    /// Type universe.
    U(univ_lvl::Expr),

    /// Inductive type family.
    Fix {
        /// Type.
        ty: Box<Val>,

        /// Constructors.
        ctors: Vec<Val>,
    },

    /// The `i`-th constructor of the inductive type family.
    Ctor {
        /// The inductive type family.
        fix: Box<Val>,

        /// Index of the constructor.
        i: usize,

        /// Arguments to the constructor.
        args: Vec<Val>,
    },

    /// Principle of induction.
    Ind {
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
    fn reify(&self, l: Lvl) -> Result<Tm, Error> {
        match self {
            Val::Var(k) => {
                let i = Ix(l.0.checked_sub(k.0 + 1).expect("de Bruijn level underflow"));
                Ok(Tm::Var(i))
            }
            Val::Abs(closure) => Ok(Tm::Abs(Box::new(closure.reify(l)?))),
            Val::App(n, m) => Ok(Tm::App(Box::new(n.reify(l)?), Box::new(m.reify(l)?))),
            Val::Pi(closure) => Ok(Tm::Pi(Box::new(closure.reify(l)?))),
            Val::U(n) => Ok(Tm::U(n.clone())),
            Val::Fix { ty, ctors } => Ok(Tm::Fix {
                ty: Box::new(ty.reify(l)?),
                ctors: ctors
                    .iter()
                    .map(|ctor| ctor.reify(l))
                    .collect::<Result<_, _>>()?,
            }),
            Val::Ctor { fix, i, args } => Ok(Tm::Ctor {
                fix: Box::new(fix.reify(l)?),
                i: *i,
                args: args
                    .iter()
                    .map(|arg| arg.reify(l))
                    .collect::<Result<_, _>>()?,
            }),
            Val::Ind { motive, cases, val } => Ok(Tm::Ind {
                motive: Box::new(motive.reify(l)?),
                cases: cases
                    .iter()
                    .map(|case| case.reify(l))
                    .collect::<Result<_, _>>()?,
                val: Box::new(val.reify(l)?),
            }),
        }
    }

    /// Applies the value to another value.
    fn apply(&self, val: Val) -> Result<Val, Error> {
        match self {
            Val::Abs(closure) => closure.apply(val),
            _ => Ok(Val::App(Box::new(self.clone()), Box::new(val))),
        }
    }

    /// Applies the principle of induction to the value.
    fn induction(&self, motive: Val, cases: Vec<Val>, l: Lvl) -> Result<Val, Error> {
        let Val::Ctor { fix, i, args } = self else {
            return Ok(Val::Ind {
                motive: Box::new(motive),
                cases,
                val: Box::new(self.clone()),
            });
        };
        let Val::Fix { ty: _, ctors } = &**fix else {
            return Ok(Val::Ind {
                motive: Box::new(motive),
                cases,
                val: Box::new(self.clone()),
            });
        };
        let Some(ctor) = ctors.get(*i) else {
            return Ok(Val::Ind {
                motive: Box::new(motive),
                cases,
                val: Box::new(self.clone()),
            });
        };
        let Val::Abs(closure) = ctor else {
            return Ok(Val::Ind {
                motive: Box::new(motive),
                cases,
                val: Box::new(self.clone()),
            });
        };
        let mut ctor = closure.apply(Val::Var(l))?;
        let Some(mut case) = cases.get(*i).cloned() else {
            return Ok(Val::Ind {
                motive: Box::new(motive),
                cases,
                val: Box::new(self.clone()),
            });
        };
        let mut args = args.iter().enumerate();
        while let Val::Pi(closure) = &ctor {
            let Some((j, arg)) = args.next() else {
                return Ok(Val::Ind {
                    motive: Box::new(motive),
                    cases,
                    val: Box::new(self.clone()),
                });
            };
            case = case.apply(arg.clone())?;
            if closure.ty.is_apply_of_var(l) {
                case = case.apply(arg.induction(motive.clone(), cases.clone(), l)?)?;
            }
            ctor = closure.apply(Val::Var(Lvl(l.0 + 1 + j)))?;
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
    fn uncurrify_pi(&self, l: Lvl) -> Result<Pis, Error> {
        let mut v = self.clone();
        let mut args = vec![];
        while let Val::Pi(closure) = v {
            args.push(closure.ty.clone());
            v = closure.apply(Val::Var(Lvl(l.0 + args.len())))?;
        }
        Ok(Pis { args, out: v })
    }

    /// Validates a constructor parameter.
    fn check_ctor_param(
        &self,
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
                    .check_ctor_param(l, fix_l, fix_universe, fix_indices, -v)?;
                closure.apply(Val::Var(l))?.check_ctor_param(
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
                        if arg.has_var(l, fix_l)? {
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
    fn has_var(&self, l: Lvl, var_l: Lvl) -> Result<bool, Error> {
        match self {
            Val::Var(k) => Ok(*k == var_l),
            Val::App(m, n) => Ok(m.has_var(l, var_l)? || n.has_var(l, var_l)?),
            Val::Abs(closure) => Ok(closure.ty.has_var(l, var_l)?
                || closure.apply(Val::Var(l))?.has_var(Lvl(l.0 + 1), var_l)?),
            Val::Pi(closure) => Ok(closure.ty.has_var(l, var_l)?
                || closure.apply(Val::Var(l))?.has_var(Lvl(l.0 + 1), var_l)?),
            Val::U(_) => Ok(false),
            Val::Fix { ty, ctors } => {
                let mut has_var = ty.has_var(l, var_l)?;
                for ctor in ctors {
                    has_var = has_var || ctor.has_var(l, var_l)?;
                }
                Ok(has_var)
            }
            Val::Ctor { fix, i: _, args } => {
                let mut has_var = fix.has_var(l, var_l)?;
                for arg in args {
                    has_var = has_var || arg.has_var(l, var_l)?;
                }
                Ok(has_var)
            }
            Val::Ind { motive, cases, val } => {
                let mut has_var = motive.has_var(l, var_l)?;
                for case in cases {
                    has_var = has_var || case.has_var(l, var_l)?;
                }
                has_var = has_var || val.has_var(l, var_l)?;
                Ok(has_var)
            }
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
        // (λx.x) = (λx.x)
        let id = Tm::Abs(Box::new(Binding {
            bound_ty: Tm::U(univ_lvl::Var(0).into()),
            body: Tm::Var(Ix(0)),
        }));
        assert_eq!(id.beta_eq(&id), Ok(true));

        // (λx.x) (λx.x) = x
        let id_id = Tm::App(Box::new(id.clone()), Box::new(id.clone()));
        assert_eq!(id_id.beta_eq(&id), Ok(true));

        // (λx.(λy.y) x) = (λx.x)
        let id_eta = Tm::Abs(Box::new(Binding {
            bound_ty: Tm::U(univ_lvl::Var(0).into()),
            body: Tm::App(Box::new(id.clone()), Box::new(Tm::Var(Ix(0)))),
        }));
        assert_eq!(id_eta.beta_eq(&id), Ok(true));
    }

    #[test]
    fn induction() {
        // ℕ := μX.[X; X → X]
        let n = Tm::Fix {
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
        let two = Tm::Ctor {
            fix: Box::new(n.clone()),
            i: 1,
            args: vec![Tm::Ctor {
                fix: Box::new(n.clone()),
                i: 1,
                args: vec![Tm::Ctor {
                    fix: Box::new(n.clone()),
                    i: 0,
                    args: vec![],
                }],
            }],
        };

        // 3 : ℕ
        let three = Tm::Ctor {
            fix: Box::new(n.clone()),
            i: 1,
            args: vec![two.clone()],
        };

        // 5 : ℕ
        let five = Tm::Ctor {
            fix: Box::new(n.clone()),
            i: 1,
            args: vec![Tm::Ctor {
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
                body: Tm::Ind {
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
                                body: Tm::Ctor {
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
                .eval(&Default::default())
                .and_then(|v| v.reify(Lvl(0))),
            Ok(five)
        );
    }

    #[test]
    fn ty() {
        // λx.x : U 0 → U 0
        let id = Tm::Abs(Box::new(Binding {
            bound_ty: Tm::U(univ_lvl::Var(0).into()),
            body: Tm::Var(Ix(0)),
        }));
        let id_ty = Tm::Pi(Box::new(Binding {
            bound_ty: Tm::U(univ_lvl::Var(0).into()),
            body: Tm::U(univ_lvl::Var(0).into()),
        }));
        assert_eq!(id.ty(), Ok(id_ty.clone()));

        // (λx.x) (λx.x) : U 0 → U 0
        let n = Tm::Abs(Box::new(Binding {
            bound_ty: id_ty.clone(),
            body: Tm::Var(Ix(0)),
        }));
        let id_id = Tm::App(Box::new(n.clone()), Box::new(id.clone()));
        assert_eq!(id_id.ty(), Ok(id_ty));

        // Πx.x : U 1
        let n = Tm::Pi(Box::new(Binding {
            bound_ty: Tm::U(univ_lvl::Var(0).into()),
            body: Tm::Var(Ix(0)),
        }));
        let n_ty = Tm::U(univ_lvl::Expr::from(univ_lvl::Var(0)) + 1);
        assert_eq!(n.ty(), Ok(n_ty));
    }

    #[test]
    fn ty_fix() {
        // ℕ := μX.[X; X → X]
        let n = Tm::Fix {
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
        assert_eq!(n.ty(), Ok(Tm::U(univ_lvl::Var(0).into())));

        // S 0 : ℕ
        let one = Tm::Ctor {
            fix: Box::new(n.clone()),
            i: 1,
            args: vec![Tm::Ctor {
                fix: Box::new(n.clone()),
                i: 0,
                args: vec![],
            }],
        };
        assert_eq!(one.ty(), Ok(n.clone()));
    }

    #[test]
    fn ty_ind() {
        // ℕ := μX.[X; X → X]
        let n = Tm::Fix {
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
                body: Tm::Ind {
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
                                body: Tm::Ctor {
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
            add.ty(),
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

        assert_eq!(proof.ty().unwrap().beta_eq(&statement), Ok(true));
    }
}

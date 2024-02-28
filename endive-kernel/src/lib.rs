pub mod univ_lvl;

use std::ops::Neg;

/// de Bruijn index.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub struct Ix(pub usize);

/// de Bruijn level.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub struct Lvl(usize);

/// Lambda abstraction or dependent product type.
#[derive(Clone, PartialEq, Eq, Debug)]
pub struct Abs {
    /// Type of the bound variable.
    pub ty: Tm,

    /// Body of the abstraction.
    pub body: Tm,
}

impl Abs {
    /// Evaluates the abstraction to a closure in the given environment.
    pub fn eval(&self, env: &Env) -> Result<Closure, Error> {
        Ok(Closure {
            ty: self.ty.eval(env)?,
            body: self.body.clone(),
            env: env.clone(),
        })
    }
}

/// Lambda term.
#[derive(Clone, PartialEq, Eq, Debug)]
pub enum Tm {
    /// Variable.
    Var(Ix),

    /// Lambda abstraction.
    Abs(Box<Abs>),

    /// Application.
    App(Box<Tm>, Box<Tm>),

    /// Dependent product type.
    Pi(Box<Abs>),

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

/// Environment.
///
/// The environment is a list of values. The last element in the vector is the head of the
/// list, which is the closest variable in the scope chain.
pub type Env = Vec<Val>;

/// Typing environment.
///
/// The environment is a list of values. The last element in the vector is the head of the
/// list, which is the type of closest variable in the scope chain.
pub type TyEnv = Vec<Val>;

/// Error type.
#[derive(PartialEq, Eq, Debug)]
pub enum Error {
    IxOverflow,
    LvlUnderflow,
    TyMismatch,
}

impl Tm {
    /// Evaluates a lambda term to weak head normal form in the given environment.
    pub fn eval(&self, env: &Env) -> Result<Val, Error> {
        match self {
            Tm::Var(i) => env.iter().rev().nth(i.0).ok_or(Error::IxOverflow).cloned(),
            Tm::Abs(abs) => Ok(Val::Abs(Box::new(abs.eval(env)?))),
            Tm::App(n, m) => {
                let n = n.eval(env)?;
                let m = m.eval(env)?;
                match n {
                    Val::Abs(closure) => closure.apply(m),
                    _ => Ok(Val::App(Box::new(n), Box::new(m))),
                }
            }
            Tm::Pi(abs) => Ok(Val::Pi(Box::new(abs.eval(env)?))),
            Tm::U(n) => Ok(Val::U(n.clone())),
            Tm::Fix { ty, ctors } => Ok(Val::Fix {
                ty: ty.eval(env)?.into(),
                ctors: ctors
                    .iter()
                    .map(|ctor| ctor.eval(env))
                    .collect::<Result<_, _>>()?,
            }),
            Tm::Ctor { fix, i, args } => Ok(Val::Ctor {
                fix: Box::new(fix.eval(env)?),
                i: *i,
                args: args
                    .iter()
                    .map(|arg| arg.eval(env))
                    .collect::<Result<_, _>>()?,
            }),
            Tm::Ind { motive, cases, val } => {
                let motive = motive.eval(env)?;
                let cases = cases
                    .iter()
                    .map(|case| case.eval(env))
                    .collect::<Result<_, _>>()?;
                let val = val.eval(env)?;
                val.induction(motive, cases, Lvl(env.len()))
            }
        }
    }

    /// Beta normalizes the lambda term.
    pub fn normalize(&self, env: &Env) -> Result<Tm, Error> {
        // Normalization by Evaluation
        self.eval(env)?.reify(Lvl(env.len()))
    }

    /// Beta equivalence.
    pub fn beta_eq(&self, other: &Tm, env: &Env) -> Result<bool, Error> {
        Ok(self.normalize(env)? == other.normalize(env)?)
    }

    /// Infers the type of the lambda term using rules from Pure Type Systems.
    pub fn ty(&self, env: &mut Env, ty_env: &mut TyEnv) -> Result<Val, Error> {
        let l = Lvl(env.len());

        match self {
            Tm::Var(i) => ty_env
                .iter()
                .rev()
                .nth(i.0)
                .ok_or(Error::IxOverflow)
                .cloned(),
            Tm::Abs(abs) => {
                // Check that the type of the bound variable is a type.
                abs.ty.univ_lvl(env, ty_env)?;

                let ty = abs.ty.clone().eval(env)?;

                env.push(Val::Var(l));
                ty_env.push(ty.clone());

                let body_ty = abs.body.ty(env, ty_env);

                env.pop();
                ty_env.pop();

                let body_ty = body_ty?;

                Ok(Val::Pi(Box::new(Closure {
                    ty,
                    body: body_ty.reify(Lvl(l.0 + 1))?,
                    env: env.clone(),
                })))
            }
            Tm::App(n, m) => match n.ty(env, ty_env)? {
                Val::Pi(mut closure) => {
                    let m_ty = m.ty(env, ty_env)?.reify(l);
                    let param_ty = closure.ty.reify(l);
                    if m_ty == param_ty {
                        closure.env.push(m.clone().eval(env)?);
                        Ok(closure.body.eval(&closure.env)?)
                    } else {
                        Err(Error::TyMismatch)
                    }
                }
                _ => Err(Error::TyMismatch),
            },
            Tm::Pi(abs) => {
                let ty_u = abs.ty.univ_lvl(env, ty_env)?;
                let ty = abs.ty.clone().eval(env)?;

                env.push(Val::Var(l));
                ty_env.push(ty);

                let body_u = abs.body.univ_lvl(env, ty_env);

                env.pop();
                ty_env.pop();

                let body_u = body_u?;

                Ok(Val::U(ty_u.max(&body_u)))
            }
            Tm::U(u) => Ok(Val::U(u.clone() + 1)),
            Tm::Fix { ty, ctors } => {
                ty.ty(env, ty_env)?;

                let ty = ty.clone().eval(env)?;
                let uncurrified = ty.uncurrify_pi(l)?;
                let universe = match uncurrified.out {
                    Val::U(n) => n,
                    _ => return Err(Error::TyMismatch),
                };

                // Check that the indices belong to a universe strictly smaller than the universe
                // of the inductive type family.
                for index in &uncurrified.args {
                    if index.reify(l)?.univ_lvl(env, ty_env)? >= universe {
                        return Err(Error::TyMismatch);
                    }
                }

                for ctor in ctors {
                    match ctor.ty(env, ty_env)? {
                        Val::Pi(closure) if closure.ty.reify(l) == ty.reify(l) => {}
                        _ => return Err(Error::TyMismatch),
                    }

                    let ctor_uncurrified = ctor
                        .eval(env)?
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
                fix.ty(env, ty_env)?;

                let mut ctor = match fix.eval(env)? {
                    Val::Fix { ty, ctors } => ctors
                        .get(*i)
                        .cloned()
                        .ok_or(Error::TyMismatch)?
                        .apply(Val::Fix { ty, ctors })?,
                    _ => return Err(Error::TyMismatch),
                };

                // Check that the constructor is called with the right arguments.
                for (i, arg) in args.iter().enumerate() {
                    let arg_ty = arg.ty(env, ty_env)?;
                    ctor = match &ctor {
                        Val::Pi(closure) => {
                            if closure.ty.reify(Lvl(l.0 + 1 + i))? != arg_ty.reify(l)? {
                                return Err(Error::TyMismatch);
                            }
                            closure.apply(arg.eval(env)?)?
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

                let motive_uncurrified = motive.ty(env, ty_env)?.uncurrify_pi(l)?;

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

                let val_ty_uncurrified = val.ty(env, ty_env)?.uncurrify_app()?;

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

                let motive = motive.eval(env)?;
                let fix_val = fix.eval(env)?;

                for (i, (case, ctor)) in cases.iter().zip(fix_ctors.iter()).enumerate() {
                    // Part 3.1: construct the expected constructor parameters by filtering out the
                    // induction hypotheses.

                    let mut case_ty_l = Lvl(l.0);
                    let mut case_ty = case.ty(env, ty_env)?;

                    let mut expected_ctor_params = Vec::new();
                    let mut out_ctor_args = Vec::new();

                    let mut prev_was_self = false;

                    while let Val::Pi(closure) = &case_ty {
                        if prev_was_self {
                            prev_was_self = false;

                            // Ignore the induction hypothesis.
                            case_ty = closure.body.unlift(0, 1)?.eval(&closure.env)?;
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

                motive.apply(val.eval(env)?)
            }
        }
    }

    /// Computes the level of the universe to which the lambda term belongs.
    pub fn univ_lvl(&self, env: &mut Env, ty_env: &mut TyEnv) -> Result<univ_lvl::Expr, Error> {
        match self.ty(env, ty_env)? {
            Val::U(n) => Ok(n),
            _ => Err(Error::TyMismatch),
        }
    }

    /// Subtracts `by` from the de Bruijn indices greater or equal to `k` in the lambda term.
    pub fn unlift(&self, k: usize, by: usize) -> Result<Tm, Error> {
        match self {
            Tm::Var(i) => {
                if i.0 < k {
                    Ok(Tm::Var(*i))
                } else {
                    Ok(Tm::Var(Ix(i.0.checked_sub(by).ok_or(Error::IxOverflow)?)))
                }
            }
            Tm::Abs(abs) => Ok(Tm::Abs(Box::new(Abs {
                ty: abs.ty.unlift(k, by)?,
                body: abs.body.unlift(k + 1, by)?,
            }))),
            Tm::App(m, n) => Ok(Tm::App(
                Box::new(m.unlift(k, by)?),
                Box::new(n.unlift(k, by)?),
            )),
            Tm::Pi(abs) => Ok(Tm::Pi(Box::new(Abs {
                ty: abs.ty.unlift(k, by)?,
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

/// Lambda abstraction or dependent product type with an environment.
#[derive(Clone, Debug)]
pub struct Closure {
    pub ty: Val,
    pub body: Tm,
    pub env: Env,
}

impl Closure {
    /// Applies the closure to a value.
    pub fn apply(&self, val: Val) -> Result<Val, Error> {
        let mut env = self.env.clone();
        env.push(val);
        self.body.eval(&env)
    }

    /// Reifies the closure into an abstraction in normal form. Variables are reified into de
    /// Bruijn indices assuming current level `l`.
    pub fn reify(&self, l: Lvl) -> Result<Abs, Error> {
        Ok(Abs {
            ty: self.ty.reify(l)?,
            body: self.apply(Val::Var(l))?.reify(Lvl(l.0 + 1))?,
        })
    }
}

/// Lambda term in weak head normal form.
#[derive(Clone, Debug)]
pub enum Val {
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
    pub fn reify(&self, l: Lvl) -> Result<Tm, Error> {
        match self {
            Val::Var(k) => {
                let i = Ix(l.0.checked_sub(k.0 + 1).ok_or(Error::LvlUnderflow)?);
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
    pub fn apply(&self, val: Val) -> Result<Val, Error> {
        match self {
            Val::Abs(closure) => closure.apply(val),
            _ => Ok(Val::App(Box::new(self.clone()), Box::new(val))),
        }
    }

    /// Applies the principle of induction to the value.
    pub fn induction(&self, motive: Val, cases: Vec<Val>, l: Lvl) -> Result<Val, Error> {
        match self {
            Val::Ctor { fix, i, args } => {
                let ctor = match &**fix {
                    Val::Fix { ty: _, ctors } => ctors.get(*i).ok_or(Error::TyMismatch)?,
                    _ => return Err(Error::TyMismatch),
                };
                let mut ctor = match ctor {
                    Val::Abs(closure) => closure.apply(Val::Var(l))?,
                    _ => return Err(Error::TyMismatch),
                };
                let mut case = cases.get(*i).ok_or(Error::TyMismatch)?.clone();
                let mut args = args.iter().enumerate();
                while let Val::Pi(closure) = &ctor {
                    let (j, arg) = args.next().ok_or(Error::TyMismatch)?;
                    case = case.apply(arg.clone())?;
                    if closure.ty.is_apply_of_var(l) {
                        case = case.apply(arg.induction(motive.clone(), cases.clone(), l)?)?;
                    }
                    ctor = closure.apply(Val::Var(Lvl(l.0 + 1 + j)))?;
                }
                Ok(case)
            }
            _ => Ok(Val::Ind {
                motive: Box::new(motive),
                cases,
                val: Box::new(self.clone()),
            }),
        }
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
        let id = Tm::Abs(Box::new(Abs {
            ty: Tm::U(univ_lvl::Var(0).into()),
            body: Tm::Var(Ix(0)),
        }));
        assert_eq!(id.beta_eq(&id, &vec![]), Ok(true));

        // (λx.x) (λx.x) = x
        let id_id = Tm::App(Box::new(id.clone()), Box::new(id.clone()));
        assert_eq!(id_id.beta_eq(&id, &vec![]), Ok(true));

        // (λx.(λy.y) x) = (λx.x)
        let id_eta = Tm::Abs(Box::new(Abs {
            ty: Tm::U(univ_lvl::Var(0).into()),
            body: Tm::App(Box::new(id.clone()), Box::new(Tm::Var(Ix(0)))),
        }));
        assert_eq!(id_eta.beta_eq(&id, &vec![]), Ok(true));
    }

    #[test]
    fn induction() {
        // ℕ := μX.[X; X → X]
        let n = Tm::Fix {
            ty: Box::new(Tm::U(univ_lvl::Var(0).into())),
            ctors: vec![
                Tm::Abs(Box::new(Abs {
                    ty: Tm::U(univ_lvl::Var(0).into()),
                    body: Tm::Var(Ix(0)),
                })),
                Tm::Abs(Box::new(Abs {
                    ty: Tm::U(univ_lvl::Var(0).into()),
                    body: Tm::Pi(Box::new(Abs {
                        ty: Tm::Var(Ix(0)),
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
        let add = Tm::Abs(Box::new(Abs {
            ty: n.clone(),
            body: Tm::Abs(Box::new(Abs {
                ty: n.clone(),
                body: Tm::Ind {
                    motive: Box::new(Tm::Abs(Box::new(Abs {
                        ty: n.clone(),
                        body: n.clone(),
                    }))),
                    cases: vec![
                        Tm::Var(Ix(1)),
                        Tm::Abs(Box::new(Abs {
                            ty: n.clone(),
                            body: Tm::Abs(Box::new(Abs {
                                ty: n.clone(),
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
            add_two_three.eval(&vec![]).and_then(|v| v.reify(Lvl(0))),
            Ok(five)
        );
    }

    #[test]
    fn ty() {
        // λx.x : U 0 → U 0
        let id = Tm::Abs(Box::new(Abs {
            ty: Tm::U(univ_lvl::Var(0).into()),
            body: Tm::Var(Ix(0)),
        }));
        let id_ty = Tm::Pi(Box::new(Abs {
            ty: Tm::U(univ_lvl::Var(0).into()),
            body: Tm::U(univ_lvl::Var(0).into()),
        }));
        assert_eq!(
            id.ty(&mut vec![], &mut vec![])
                .and_then(|v| v.reify(Lvl(0))),
            Ok(id_ty.clone())
        );

        // (λx.x) (λx.x) : U 0 → U 0
        let n = Tm::Abs(Box::new(Abs {
            ty: id_ty.clone(),
            body: Tm::Var(Ix(0)),
        }));
        let id_id = Tm::App(Box::new(n.clone()), Box::new(id.clone()));
        assert_eq!(
            id_id
                .ty(&mut vec![], &mut vec![])
                .and_then(|v| v.reify(Lvl(0))),
            Ok(id_ty)
        );

        // Πx.x : U 1
        let n = Tm::Pi(Box::new(Abs {
            ty: Tm::U(univ_lvl::Var(0).into()),
            body: Tm::Var(Ix(0)),
        }));
        let n_ty = Tm::U(univ_lvl::Expr::from(univ_lvl::Var(0)) + 1);
        assert_eq!(
            n.ty(&mut vec![], &mut vec![]).and_then(|v| v.reify(Lvl(0))),
            Ok(n_ty)
        );
    }

    #[test]
    fn ty_fix() {
        // ℕ := μX.[X; X → X]
        let n = Tm::Fix {
            ty: Box::new(Tm::U(univ_lvl::Var(0).into())),
            ctors: vec![
                Tm::Abs(Box::new(Abs {
                    ty: Tm::U(univ_lvl::Var(0).into()),
                    body: Tm::Var(Ix(0)),
                })),
                Tm::Abs(Box::new(Abs {
                    ty: Tm::U(univ_lvl::Var(0).into()),
                    body: Tm::Pi(Box::new(Abs {
                        ty: Tm::Var(Ix(0)),
                        body: Tm::Var(Ix(1)),
                    })),
                })),
            ],
        };

        // ℕ : U 0
        assert_eq!(
            n.ty(&mut vec![], &mut vec![]).and_then(|v| v.reify(Lvl(0))),
            Ok(Tm::U(univ_lvl::Var(0).into()))
        );

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
        assert_eq!(
            one.ty(&mut vec![], &mut vec![])
                .and_then(|v| v.reify(Lvl(0))),
            Ok(n.clone())
        );
    }

    #[test]
    fn ty_ind() {
        // ℕ := μX.[X; X → X]
        let n = Tm::Fix {
            ty: Box::new(Tm::U(univ_lvl::Var(0).into())),
            ctors: vec![
                Tm::Abs(Box::new(Abs {
                    ty: Tm::U(univ_lvl::Var(0).into()),
                    body: Tm::Var(Ix(0)),
                })),
                Tm::Abs(Box::new(Abs {
                    ty: Tm::U(univ_lvl::Var(0).into()),
                    body: Tm::Pi(Box::new(Abs {
                        ty: Tm::Var(Ix(0)),
                        body: Tm::Var(Ix(1)),
                    })),
                })),
            ],
        };

        // add : ℕ → ℕ → ℕ
        let add = Tm::Abs(Box::new(Abs {
            ty: n.clone(),
            body: Tm::Abs(Box::new(Abs {
                ty: n.clone(),
                body: Tm::Ind {
                    motive: Box::new(Tm::Abs(Box::new(Abs {
                        ty: n.clone(),
                        body: n.clone(),
                    }))),
                    cases: vec![
                        Tm::Var(Ix(1)),
                        Tm::Abs(Box::new(Abs {
                            ty: n.clone(),
                            body: Tm::Abs(Box::new(Abs {
                                ty: n.clone(),
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
            add.ty(&mut vec![], &mut vec![])
                .and_then(|v| v.reify(Lvl(0))),
            Ok(Tm::Pi(Box::new(Abs {
                ty: n.clone(),
                body: Tm::Pi(Box::new(Abs {
                    ty: n.clone(),
                    body: n.clone(),
                })),
            })))
        );
    }
}

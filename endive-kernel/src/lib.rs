/// de Bruijn index.
#[derive(Clone, Copy, PartialEq, Eq)]
pub struct Ix(pub usize);

/// de Bruijn level.
#[derive(Clone, Copy, PartialEq, Eq)]
pub struct Lvl(usize);

/// Lambda abstraction or dependent product type.
#[derive(Clone, PartialEq, Eq)]
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
#[derive(Clone, PartialEq, Eq)]
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
    U(u32),
}

/// Environment.
///
/// The environment is a list of values. The last element in the vector is the head of the
/// list, which is the closest variable in the scope chain.
pub type Env = Vec<Val>;

/// Error type.
#[derive(PartialEq, Eq, Debug)]
pub enum Error {
    IxOverflow,
    LvlUnderflow,
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
            Tm::U(n) => Ok(Val::U(*n)),
        }
    }

    /// Beta normalizes the lambda term.
    pub fn normalize(&self, env: &Env) -> Result<Tm, Error> {
        // Normalization by Evaluation
        self.eval(env)?.reify(Lvl(0))
    }

    /// Beta equivalence.
    pub fn beta_eq(&self, other: &Tm, env: &Env) -> Result<bool, Error> {
        Ok(self.normalize(env)? == other.normalize(env)?)
    }
}

/// Lambda abstraction or dependent product type with an environment.
#[derive(Clone)]
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
#[derive(Clone)]
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
    U(u32),
}

impl Val {
    /// Reifies a value into a normal form. Variables are reified into de Bruijn indices assuming
    /// current level `l`.
    pub fn reify(&self, l: Lvl) -> Result<Tm, Error> {
        match self {
            Val::Var(k) => {
                let i = Ix(l.0.checked_sub(k.0).ok_or(Error::LvlUnderflow)?);
                Ok(Tm::Var(i))
            }
            Val::Abs(closure) => Ok(Tm::Abs(Box::new(closure.reify(l)?))),
            Val::App(n, m) => Ok(Tm::App(Box::new(n.reify(l)?), Box::new(m.reify(l)?))),
            Val::Pi(closure) => Ok(Tm::Pi(Box::new(closure.reify(l)?))),
            Val::U(n) => Ok(Tm::U(*n)),
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
            ty: Tm::U(0),
            body: Tm::Var(Ix(0)),
        }));
        assert_eq!(id.beta_eq(&id, &vec![]), Ok(true));

        // (λx.x) (λx.x) = x
        let id_id = Tm::App(Box::new(id.clone()), Box::new(id.clone()));
        assert_eq!(id_id.beta_eq(&id, &vec![]), Ok(true));

        // (λx.(λy.y) x) = (λx.x)
        let id_eta = Tm::Abs(Box::new(Abs {
            ty: Tm::U(0),
            body: Tm::App(Box::new(id.clone()), Box::new(Tm::Var(Ix(0)))),
        }));
        assert_eq!(id_eta.beta_eq(&id, &vec![]), Ok(true));
    }
}

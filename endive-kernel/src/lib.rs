/// de Bruijn index.
#[derive(Clone, Copy, PartialEq, Eq)]
pub struct Ix(pub usize);

/// de Bruijn level.
#[derive(Clone, Copy, PartialEq, Eq)]
pub struct Lvl(usize);

/// Lambda term.
#[derive(Clone, PartialEq, Eq)]
pub enum Tm {
    Var(Ix),
    Abs(Box<Tm>),
    App(Box<Tm>, Box<Tm>),
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
            Tm::Abs(n) => Ok(Val::Abs(Closure {
                body: (**n).clone(),
                env: env.clone(),
            })),
            Tm::App(n, m) => {
                let n = n.eval(env)?;
                let m = m.eval(env)?;
                match n {
                    Val::Abs(closure) => closure.apply(m),
                    _ => Ok(Val::App(Box::new(n), Box::new(m))),
                }
            }
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

/// Lambda abstraction with an environment.
#[derive(Clone)]
pub struct Closure {
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
    pub fn reify(&self, l: Lvl) -> Result<Tm, Error> {
        let body = self.apply(Val::Var(l))?.reify(Lvl(l.0 + 1))?;
        Ok(Tm::Abs(Box::new(body)))
    }
}

/// Lambda term in weak head normal form.
#[derive(Clone)]
pub enum Val {
    Var(Lvl),
    Abs(Closure),
    App(Box<Val>, Box<Val>),
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
            Val::Abs(closure) => closure.reify(l),
            Val::App(n, m) => Ok(Tm::App(Box::new(n.reify(l)?), Box::new(m.reify(l)?))),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn beta_eq() {
        // (λx.x) = (λx.x)
        let id = Tm::Abs(Box::new(Tm::Var(Ix(0))));
        assert_eq!(id.beta_eq(&id, &vec![]), Ok(true));

        // (λx.x) (λx.x) = x
        let id_id = Tm::App(Box::new(id.clone()), Box::new(id.clone()));
        assert_eq!(id_id.beta_eq(&id, &vec![]), Ok(true));

        // (λx.(λy.y) x) = (λx.x)
        let id_eta = Tm::Abs(Box::new(Tm::App(Box::new(id.clone()), Box::new(Tm::Var(Ix(0))))));
        assert_eq!(id_eta.beta_eq(&id, &vec![]), Ok(true));
    }
}

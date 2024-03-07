use std::rc::Rc;

use crate::{Binding, Ctx, Error, Lvl, Tm, Val};

/// A lambda term accompanied by a local context.
#[derive(Clone, Debug)]
pub(crate) struct Closure {
    pub(crate) body: Tm,
    pub(crate) c: Rc<Ctx>,
}

impl Closure {
    /// Creates a new closure.
    pub(crate) fn new(body: Tm, c: Rc<Ctx>) -> Self {
        Closure { body, c }
    }
}

/// Lambda abstraction or dependent product type with a local context.
#[derive(Clone, Debug)]
pub(crate) struct BindingClosure {
    pub ty: Val,
    pub closure: Closure,
}

impl BindingClosure {
    /// Creates a new binding closure.
    pub(crate) fn new(ty: Val, body: Tm, c: Rc<Ctx>) -> Self {
        BindingClosure {
            ty,
            closure: Closure::new(body, c),
        }
    }

    /// Applies the closure to a value.
    pub(crate) fn apply(&self, val: Val) -> Result<Val, Error> {
        self.closure.body.eval(&self.closure.c.push(val))
    }

    /// Reifies the closure into an abstraction in normal form. Variables are reified into de
    /// Bruijn indices assuming current level `l`.
    pub(crate) fn reify(&self, l: Lvl) -> Result<Binding, Error> {
        Ok(Binding {
            bound_ty: self.ty.reify(l)?,
            body: self.apply(Val::Var(l))?.reify(Lvl(l.0 + 1))?,
        })
    }
}

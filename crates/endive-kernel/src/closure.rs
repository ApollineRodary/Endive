use std::rc::Rc;

use crate::{
    val::{Lvl, Val},
    Binding, Ctx, Error, GlobalEnv, Tm,
};

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
    pub(crate) fn apply(&self, e: &GlobalEnv, val: Val) -> Result<Val, Error> {
        self.closure.body.eval(e, &self.closure.c.push(val))
    }

    /// Reifies the closure into an abstraction in normal form. Variables are reified into de
    /// Bruijn indices assuming current level `l`.
    pub(crate) fn reify(&self, e: &GlobalEnv, l: Lvl) -> Result<Binding, Error> {
        Ok(Binding {
            bound_ty: self.ty.reify(e, l)?,
            body: self.apply(e, Val::Var(l))?.reify(e, Lvl(l.0 + 1))?,
        })
    }
}

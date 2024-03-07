use std::rc::Rc;

use crate::{Binding, Ctx, Error, Lvl, Tm, Val};

/// Lambda abstraction or dependent product type with a local context.
#[derive(Clone, Debug)]
pub(crate) struct Closure {
    pub ty: Val,
    pub body: Tm,
    pub c: Rc<Ctx>,
}

impl Closure {
    /// Applies the closure to a value.
    pub(crate) fn apply(&self, val: Val) -> Result<Val, Error> {
        self.body.eval(&self.c.push(val))
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

use std::rc::Rc;

use crate::{Ix, Val};

/// Local context.
///
/// It is a linked list of values where the head is the value of the variable with the innermost
/// binder.
#[derive(Debug)]
pub(crate) enum Ctx {
    Nil,
    Cons(Val, Rc<Ctx>),
}

impl Ctx {
    /// Returns the `i`-th value in the local context.
    pub(crate) fn get(&self, i: Ix) -> Option<&Val> {
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
    pub(crate) fn len(&self) -> usize {
        match self {
            Ctx::Nil => 0,
            Ctx::Cons(_, c) => 1 + c.len(),
        }
    }

    /// Pushes a value to the local context.
    pub(crate) fn push(self: &Rc<Self>, val: Val) -> Rc<Self> {
        Rc::new(Ctx::Cons(val, self.clone()))
    }

    /// Returns an iterator over the values in the local context.
    pub(crate) fn iter(&self) -> CtxIter {
        CtxIter {
            ctx: self,
            i: Ix(0),
        }
    }
}

impl Default for Ctx {
    fn default() -> Self {
        Ctx::Nil
    }
}

pub(crate) struct CtxIter<'a> {
    ctx: &'a Ctx,
    i: Ix,
}

impl<'a> Iterator for CtxIter<'a> {
    type Item = &'a Val;

    fn next(&mut self) -> Option<Self::Item> {
        let val = self.ctx.get(self.i);
        self.i.0 += 1;
        val
    }
}

/// Local typing context.
///
/// It is a linked list of values where the head is the type of the variable with the innermost
/// binder.
pub(crate) type TyCtx = Ctx;

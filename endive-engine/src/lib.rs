//! The Endive engine is the core of Endive. It knows about current definitions, and can execute
//! statements that correspond to the higher level language. It is the model behind the interactive
//! environment.

use std::collections::HashMap;

use endive_kernel::{Binding, Ix};
use endive_lambda::Tm;

pub struct Engine {
    defs: HashMap<String, endive_kernel::Tm>,
}

impl Engine {
    pub fn new() -> Engine {
        Engine {
            defs: HashMap::new(),
        }
    }

    /// Define a new constant.
    pub fn define(&mut self, name: String, tm: &Tm) -> Result<(), Error> {
        let tm = self.translate_tm(tm, &mut vec![])?;
        if tm.ty().is_err() {
            return Err(Error::InvalidTy);
        }
        self.defs.insert(
            name,
            tm.normalize()
                .expect("term failed to normalize after type checking"),
        );
        Ok(())
    }

    /// Translate a lambda term from the higher level language to the kernel language.
    fn translate_tm(&self, tm: &Tm, env: &mut Vec<String>) -> Result<endive_kernel::Tm, Error> {
        Ok(match tm {
            Tm::Id(id) => {
                match env
                .iter()
                .position(|env_id| env_id == id) {
                    Some(ix) => endive_kernel::Tm::Var(Ix(ix)),
                    None => {
                        self.defs.get(id).cloned().ok_or(Error::UnboundVariable)?
                    }
                }
            }
            Tm::Abs(binding) => {
                let bound_ty = self.translate_tm(&binding.bound_ty, env)?;

                env.push(binding.bound_name.clone());
                let body = self.translate_tm(&binding.body, env);
                env.pop();

                endive_kernel::Tm::Abs(Box::new(Binding {
                    bound_ty,
                    body: body?,
                }))
            }
            Tm::App(n, m) => endive_kernel::Tm::App(
                Box::new(self.translate_tm(n, env)?),
                Box::new(self.translate_tm(m, env)?),
            ),
            Tm::Ty => endive_kernel::Tm::U(Default::default()),
            _ => todo!(),
        })
    }
}

#[derive(Debug)]
pub enum Error {
    UnboundVariable,
    InvalidTy,
}

#[cfg(test)]
mod tests {
    use endive_lambda::{Binding, Tm};

    use super::Engine;

    #[test]
    fn define() {
        let mut engine = Engine::new();
        let tm = Tm::Abs(Box::new(Binding {
            bound_name: "x".to_owned(),
            bound_ty: Tm::Ty,
            body: Tm::Id("x".to_owned()),
        }));
        engine.define("id".to_owned(), &tm).unwrap();
    }
}

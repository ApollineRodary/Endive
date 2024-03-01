//! The Endive engine is the core of Endive. It knows about current definitions, and can execute
//! statements that correspond to the higher level language. It is the model behind the interactive
//! environment.

use endive_kernel::{Binding, Ix};
use endive_lambda::Tm;

pub struct Engine {}

impl Engine {
    pub fn new() -> Engine {
        Engine {}
    }

    /// Translate a lambda term from the higher level language to the kernel language.
    fn translate_tm(
        &self,
        tm: &Tm,
        env: &mut Vec<String>,
    ) -> Result<endive_kernel::Tm, TranslateError> {
        Ok(match tm {
            Tm::Id(id) => {
                let ix = Ix(env
                    .iter()
                    .position(|env_id| env_id == id)
                    .ok_or(TranslateError::UnboundVariable)?);
                endive_kernel::Tm::Var(ix)
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

enum TranslateError {
    UnboundVariable,
}

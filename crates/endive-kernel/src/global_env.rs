use crate::{Error, InductiveTypeFamily};

/// Global environment, which stores inducive type families.
pub struct GlobalEnv {
    /// Inductive type families.
    inductives: Vec<InductiveTypeFamily>,
}

impl GlobalEnv {
    /// Creates a new global environment.
    pub fn new() -> Self {
        GlobalEnv {
            inductives: Vec::new(),
        }
    }

    /// Tries to add an inductive type family to the global environment, and returns its index.
    ///
    /// If the family is invalid, it is not added to the environment and an error is returned.
    pub fn add_inductive(&mut self, family: InductiveTypeFamily) -> Result<usize, Error> {
        let index = self.inductives.len();
        self.inductives.push(family);
        match self.inductives[index].validate(self, index) {
            Ok(()) => Ok(index),
            Err(e) => {
                self.inductives.pop();
                Err(e)
            }
        }
    }
}

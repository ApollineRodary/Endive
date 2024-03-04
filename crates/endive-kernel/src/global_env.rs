use crate::InductiveTypeFamily;

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

    /// Adds an inductive type family to the global environment.
    pub fn add_inductive(&mut self, family: InductiveTypeFamily) {
        self.inductives.push(family);
    }
}

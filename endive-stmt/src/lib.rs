//! This crate provides the `Stmt` type, which is a representation of a single statement in a
//! Endive program. A statement is a top-level declaration, such as a constant definition or a
//! theorem.

use endive_lambda::Tm;

/// A single statement in a Endive program.
pub enum Stmt {
    Define(String, Tm),
}

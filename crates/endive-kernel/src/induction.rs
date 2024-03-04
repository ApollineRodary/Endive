use crate::{univ_lvl, Tm};

/// A sequence of types. For each type, an argument of that type is bound in every subsequent type.
pub struct Telescope(pub Vec<Tm>);

/// A parameterized family of inductive types.
pub struct InductiveTypeFamily {
    /// The parameters of the family.
    ///
    /// They are bound in the indices and constructors, and constructors have to use them everytime
    /// they refer to the family.
    pub params: Telescope,

    /// The indices of the family.
    ///
    /// They are not bound in the constructors.
    pub indices: Telescope,

    /// The universe level to which the inducive types belong.
    pub univ_lvl: univ_lvl::Expr,

    /// The number of universe variables that are used in the family.
    pub univ_vars: usize,

    /// The constructors of the family.
    pub ctors: Vec<Ctor>,
}

/// A constructor of an inductive type family.
pub struct Ctor {
    /// The parameters of the constructor.
    pub params: Vec<CtorParam>,

    /// The indices for the constructed value.
    ///
    /// For example, if the inductive type family is `F` with parameters `p : A, q : B` and indices
    /// `i : I, j : J`, then constructor `C : (p : A) -> (q : B) -> (i : I) -> C i t`, then
    /// `indices` contains the terms `i` and `t`.
    pub indices: Vec<Tm>,
}

/// A constructor parameter, which is a chain of zero or more dependent type products with
/// additional constraints to ensure strict positivity.
pub struct CtorParam {
    /// The telescope of the parameter.
    pub tele: Telescope,

    /// The last type in the chain of dependent product types.
    pub tail: CtorParamTail,
}

/// The last type in the chain of dependent product types representing a constructor parameter.
///
/// See [`CtorParam`].
pub enum CtorParamTail {
    /// The inductive type family being defined, applied to the bound parameters and given indices,
    /// which must have the same length as the indices of the family (i.e the inductive type family
    /// must be fully applied).
    This { indices: Vec<Tm> },

    /// Another type, which does not contain the inductive type family being defined.
    Other(Tm),
}
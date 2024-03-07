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

impl InductiveTypeFamily {
    /// Validates the inductive type family.
    fn validate(&self) -> Result<(), Error> {
        let (inductive_c, inductive_tc) = self
            .params
            .add_to_ctx(Rc::new(Ctx::Nil), Rc::new(TyCtx::Nil))?;
        self.indices
            .validate_univ_level(&inductive_c, &inductive_tc, &self.univ_lvl)?;
        for ctor in &self.ctors {
            if ctor.indices.len() != self.indices.0.len() {
                return Err(Error::TyMismatch);
            }
            let c = inductive_c.clone();
            let tc = inductive_tc.clone();
            for param in &ctor.params {
                c.push(Val::Var(Lvl(c.len())));
                tc.push(param.validate(&c, &tc, &self.indices, &inductive_c, &self.univ_lvl)?);
            }
            self.indices
                .validate_apply(&inductive_c, &ctor.indices, &c, &tc)?;
        }
        Ok(())
    }
}

/// A constructor of an inductive type family.
pub struct Ctor {
    /// The types of parameters of the constructor.
    pub params: Vec<CtorParam>,

    /// The indices for the constructed value.
    ///
    /// For example, if the inductive type family is `F` with parameters `p : A, q : B` and indices
    /// `i : I, j : J`, then constructor `C : (p : A) -> (q : B) -> (i : I) -> C i t`, then
    /// `indices` contains the terms `i` and `t`.
    pub indices: Vec<Tm>,
}

/// A constructor parameter type, which is a chain of zero or more dependent type products with
/// additional constraints to ensure strict positivity.
pub struct CtorParam {
    /// The telescope of the parameter type.
    pub tele: Telescope,

    /// The last type in the chain of dependent product types.
    pub last: CtorParamLast,
}

/// The last type in the chain of dependent product types representing a constructor parameter.
///
/// See [`CtorParam`].
pub enum CtorParamLast {
    /// The inductive type family being defined, applied to the bound parameters and given indices,
    /// which must have the same length as the indices of the family (i.e the inductive type family
    /// must be fully applied).
    This { indices: Vec<Tm> },

    /// Another type, which does not contain the inductive type family being defined.
    Other(Tm),
}

use std::{
    cmp::Ordering,
    collections::HashMap,
    fmt::{self, Display, Write},
    ops::{Add, AddAssign},
};

/// Universe level variable.
#[derive(Clone, Copy, PartialEq, Eq)]
pub struct Var(pub usize);

impl Display for Var {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "@{}", self.0)
    }
}

impl fmt::Debug for Var {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        Display::fmt(self, f)
    }
}

/// Universe level expression of the form `max(0, l1 + c1, ..., lk + ck)` where `l1, ..., lk` are
/// universe level variables and `c1, ..., ck` are constants.
#[derive(Clone, PartialEq, Eq, Default)]
pub struct Expr(HashMap<usize, u32>);

impl Expr {
    /// Computes the maximum of two universe level expressions.
    pub fn max(&self, other: &Self) -> Self {
        let mut result = self.clone();
        for (&var, &other_c) in other.0.iter() {
            result
                .0
                .entry(var)
                .and_modify(|c| *c = other_c.max(*c))
                .or_insert(other_c);
        }
        result
    }
}

impl From<Var> for Expr {
    fn from(var: Var) -> Self {
        let mut map = HashMap::new();
        map.insert(var.0, 0);
        Expr(map)
    }
}

impl AddAssign<u32> for Expr {
    fn add_assign(&mut self, rhs: u32) {
        for c in self.0.values_mut() {
            *c += rhs;
        }
    }
}

impl Add<u32> for Expr {
    type Output = Self;

    fn add(mut self, rhs: u32) -> Self {
        self += rhs;
        self
    }
}

impl PartialOrd for Expr {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        let le = self <= other;
        let ge = self >= other;
        match (le, ge) {
            (true, true) => Some(Ordering::Equal),
            (true, false) => Some(Ordering::Less),
            (false, true) => Some(Ordering::Greater),
            (false, false) => None,
        }
    }

    fn le(&self, other: &Self) -> bool {
        self.0
            .iter()
            .all(|(var, c)| other.0.get(var).map_or(true, |other_c| c <= other_c))
    }

    fn ge(&self, other: &Self) -> bool {
        self.0
            .iter()
            .all(|(var, c)| other.0.get(var).map_or(true, |other_c| c >= other_c))
    }
}

impl Display for Expr {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        if self.0.is_empty() {
            return f.write_char('0');
        }

        f.write_str("max(")?;

        let mut sorted = self
            .0
            .iter()
            .map(|(&var, &c)| (Var(var), c))
            .collect::<Vec<_>>();
        sorted.sort_by_key(|&(var, _)| var.0);

        let mut first = true;

        for (var, c) in sorted.into_iter() {
            if first {
                first = false;
            } else {
                f.write_str(", ")?;
            }

            if c >= 1 {
                write!(f, "{var} + {c}")?;
            } else {
                var.fmt(f)?;
            }
        }

        f.write_char(')')
    }
}

impl fmt::Debug for Expr {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        Display::fmt(self, f)
    }
}

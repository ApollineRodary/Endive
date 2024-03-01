use core::fmt;
use std::fmt::Write;

use endive_kernel::Binding;

/// A lambda term to be printed.
pub struct Tm(pub endive_kernel::Tm);

impl fmt::Display for Tm {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        print_internal(f, &self.0, false, false, 0)
    }
}

fn print_internal(
    f: &mut fmt::Formatter,
    tm: &endive_kernel::Tm,
    paren_around_binder: bool,
    paren_around_app: bool,
    level: usize,
) -> fmt::Result {
    match tm {
        endive_kernel::Tm::Var(ix) => print_de_bruijn_level(
            f,
            level
                .checked_sub(ix.0 + 1)
                .expect("de Bruijn index out of range"),
        ),
        endive_kernel::Tm::Abs(binding) => {
            print_binding(f, 'λ', binding, paren_around_binder, level)
        }
        endive_kernel::Tm::App(n, m) => {
            if paren_around_app {
                f.write_char('(')?;
            }
            print_internal(f, n, true, false, level)?;
            f.write_char(' ')?;
            print_internal(f, m, false, true, level)?;
            if paren_around_app {
                f.write_char(')')?;
            }
            Ok(())
        }
        endive_kernel::Tm::Pi(binding) => {
            print_binding(f, 'Π', binding, paren_around_binder, level)
        }
        endive_kernel::Tm::U(n) => write!(f, "U({n})"),
        _ => todo!(),
    }
}

fn print_binding(
    f: &mut fmt::Formatter,
    c: char,
    binding: &Binding,
    paren_around_binder: bool,
    level: usize,
) -> fmt::Result {
    if paren_around_binder {
        f.write_char('(')?;
    }
    f.write_char(c)?;
    print_de_bruijn_level(f, level)?;
    f.write_char(':')?;
    print_internal(f, &binding.bound_ty, false, false, level)?;
    f.write_char('.')?;
    print_internal(f, &binding.body, false, false, level + 1)?;
    if paren_around_binder {
        f.write_char(')')?;
    }
    Ok(())
}

fn print_de_bruijn_level(f: &mut fmt::Formatter, mut level: usize) -> fmt::Result {
    loop {
        f.write_char((b'a' + (level % 26) as u8) as char)?;
        level /= 26;
        if level == 0 {
            break;
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::Tm as PrintTm;
    use endive_kernel::{Binding, Ix, Tm};

    #[test]
    fn abs() {
        assert_eq!(
            PrintTm(Tm::Abs(Box::new(Binding {
                bound_ty: Tm::U(Default::default()),
                body: Tm::Var(Ix(0)),
            })))
            .to_string(),
            "λa:U(0).a"
        );
    }
}

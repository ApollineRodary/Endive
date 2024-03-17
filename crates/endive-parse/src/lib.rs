//! Parsing for lambda terms.

use endive_lambda::{Binding, Tm};
use chumsky::{
    primitive::just,
    recursive::recursive,
    text::{ident, whitespace},
    Parser,
};

pub fn parser<'src>() -> impl Parser<'src, &'src str, Tm> {
    recursive(|tm| {
        let abs = just('λ')
            .ignore_then(whitespace())
            .ignore_then(ident())
            .then_ignore(whitespace())
            .then_ignore(just(':'))
            .then_ignore(whitespace())
            .then(tm.clone())
            .then_ignore(whitespace())
            .then_ignore(just('.'))
            .then_ignore(whitespace())
            .then(tm.clone())
            .map(|((bound_name, bound_ty), body): ((&str, _), _)| {
                Tm::Abs(Box::new(Binding {
                    bound_name: bound_name.to_owned(),
                    bound_ty,
                    body,
                }))
            });

        let pi = just('Π')
            .ignore_then(whitespace())
            .ignore_then(ident())
            .then_ignore(whitespace())
            .then_ignore(just(':'))
            .then_ignore(whitespace())
            .then(tm.clone())
            .then_ignore(whitespace())
            .then_ignore(just('.'))
            .or(just('∀')
                .ignore_then(whitespace())
                .ignore_then(ident())
                .then_ignore(whitespace())
                .then_ignore(just('∈'))
                .then_ignore(whitespace())
                .then(tm.clone())
                .then_ignore(whitespace())
                .then_ignore(just(':')))
            .then_ignore(whitespace())
            .then(tm.clone())
            .map(|((bound_name, bound_ty), body): ((&str, _), _)| {
                Tm::Pi(Box::new(Binding {
                    bound_name: bound_name.to_owned(),
                    bound_ty,
                    body,
                }))
            });

        let paren_tm = just('(')
            .ignore_then(whitespace())
            .ignore_then(tm.clone())
            .then_ignore(whitespace())
            .then_ignore(just(')'));
        let ty = just("Type").or(just("Prop")).to(Tm::Ty);
        let id = ident().map(|id: &str| Tm::Id(id.to_owned()));

        let arg = paren_tm.or(ty).or(abs).or(pi).or(id);
        let args = arg.clone().separated_by(whitespace().at_least(1));

        arg.foldl(args, |a, b| Tm::App(Box::new(a), Box::new(b)))
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn abs() {
        let input = "λx:Type.x";
        let result = parser().parse(input);
        assert_eq!(
            result.into_result(),
            Ok(Tm::Abs(Box::new(Binding {
                bound_name: "x".to_owned(),
                bound_ty: Tm::Ty,
                body: Tm::Id("x".to_owned()),
            })))
        );
    }
}

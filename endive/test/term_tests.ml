open Endive.Term
open Endive.Span

let%test "stringify term" =
  let t =
    Pi
      ( (fresh "P", fresh (Univ (fresh 1))),
        fresh
          (term_fun
             (fresh
                (term_fun (fresh (Var "P"))
                   (fresh (term_not (fresh (Var "P"))))))
             (fresh (Var "P"))) )
  in
  string_of_term t = "forall P : Type@{1}, (P -> ~P) -> P"

let%test "alpha equivalence" =
  let t = Pi ((fresh "P", fresh (Univ (fresh 1))), fresh (Var "P")) in
  let t' = Pi ((fresh "Q", fresh (Univ (fresh 1))), fresh (Var "Q")) in
  alpha_eq t t' []

let%test "normal form: beta reduction" =
  let t =
    fresh
      (App
         ( fresh (Lam ((fresh "x", fresh (Var "X")), fresh (Var "x"))),
           fresh (Var "y") ))
  in
  let t' = fresh (Var "y") in
  normal_form t = t'

let%test "normal form: beta reduction under application" =
  let t =
    fresh
      (App
         ( fresh (Var "f"),
           fresh
             (App
                ( fresh (Lam ((fresh "x", fresh (Var "X")), fresh (Var "x"))),
                  fresh (Var "y") )) ))
  in
  let t' = fresh (App (fresh (Var "f"), fresh (Var "y"))) in
  normal_form t = t'

let%test "type checking" =
  let t1 = fresh (Lam ((fresh "x", fresh (Var "X")), fresh (Var "x"))) in
  let t2 = term_fun (fresh (Var "X")) (fresh (Var "X")) in
  match ty t1 [] with Ok t2' -> alpha_eq t2'.el t2 [] | Error _ -> false

let%test "type universe" =
  let t1 = fresh (term_fun (fresh (Var "X")) (fresh (Var "Y"))) in
  let t2 = fresh (term_fun (fresh (Univ (fresh 0))) (fresh (Univ (fresh 1)))) in
  let t3 = fresh (Univ (fresh 1)) in
  let t4 = fresh (Lam ((fresh "X", fresh (Univ (fresh 0))), fresh (Var "X"))) in
  univ_level t1 [ ("X", fresh (Univ (fresh 0))); ("Y", fresh (Univ (fresh 0))) ]
  = Ok (fresh 0)
  && univ_level t2 [] = Ok (fresh 2)
  && univ_level t3 [] = Ok (fresh 2)
  && univ_level t4 []
     = Error { el = "This term is expected to be a type."; span = None }

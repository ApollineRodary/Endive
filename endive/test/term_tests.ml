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
    App
      ( fresh (Lam ((fresh "x", fresh (Var "X")), fresh (Var "x"))),
        fresh (Var "y") )
  in
  let t' = Var "y" in
  normal_form t = t'

let%test "normal form: beta reduction under application" =
  let t =
    App
      ( fresh (Var "f"),
        fresh
          (App
             ( fresh (Lam ((fresh "x", fresh (Var "X")), fresh (Var "x"))),
               fresh (Var "y") )) )
  in
  let t' = App (fresh (Var "f"), fresh (Var "y")) in
  normal_form t = t'

let%test "type checking" =
  let t1 = Lam ((fresh "x", fresh (Var "X")), fresh (Var "x")) in
  let t2 = term_fun (fresh (Var "X")) (fresh (Var "X")) in
  match ty t1 [] with Some t2' -> alpha_eq t2'.el t2 [] | None -> false

let%test "type universe" =
  let t1 = term_fun (fresh (Var "X")) (fresh (Var "Y")) in
  let t2 = term_fun (fresh (Univ (fresh 0))) (fresh (Univ (fresh 1))) in
  let t3 = Univ (fresh 1) in
  let t4 = Lam ((fresh "X", fresh (Univ (fresh 0))), fresh (Var "X")) in
  univ_level t1 [ ("X", fresh (Univ (fresh 0))); ("Y", fresh (Univ (fresh 0))) ]
  = Some (fresh 0)
  && univ_level t2 [] = Some (fresh 2)
  && univ_level t3 [] = Some (fresh 2)
  && univ_level t4 [] = None

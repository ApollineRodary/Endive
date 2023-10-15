open Endive.Term

let%test "stringify term" =
  let t =
    Pi
      ( ("P", Univ 1),
        term_fun (term_fun (Var "P") (term_not (Var "P"))) (Var "P") )
  in
  string_of_term t = "forall P : Type@{1}, (P -> ~P) -> P"

let%test "alpha equivalence" =
  let t = Pi (("P", Univ 1), Var "P") in
  let t' = Pi (("Q", Univ 1), Var "Q") in
  alpha_eq t t' []

let%test "normal form: beta reduction" =
  let t = App (Lam (("x", Var "X"), Var "x"), Var "y") in
  let t' = Var "y" in
  normal_form t = t'

let%test "normal form: beta reduction under application" =
  let t = App (Var "f", App (Lam (("x", Var "X"), Var "x"), Var "y")) in
  let t' = App (Var "f", Var "y") in
  normal_form t = t'

let%test "type checking" =
  let t1 = Lam (("x", Var "X"), Var "x") in
  let t2 = term_fun (Var "X") (Var "X") in
  match ty t1 [] with Some t2' -> alpha_eq t2' t2 [] | None -> false

let%test "type universe" =
  let t1 = term_fun (Var "X") (Var "Y") in
  let t2 = term_fun (Univ 0) (Univ 1) in
  let t3 = Univ 1 in
  let t4 = Lam (("X", Univ 0), Var "X") in
  univ_level t1 [ ("X", Univ 0); ("Y", Univ 0) ] = Some 0
  && univ_level t2 [] = Some 2
  && univ_level t3 [] = Some 2
  && univ_level t4 [] = None

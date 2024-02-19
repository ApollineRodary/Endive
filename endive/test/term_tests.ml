open Endive.Term
open Endive.Span
open Sexplib.Std
open Ppx_compare_lib.Builtin

let%test_unit "stringify term" =
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
  [%test_result: string] (string_of_term t)
    ~expect:"forall P : Type@{1}, (P -> ~P) -> P"

let%test "alpha equivalence" =
  let t = Pi ((fresh "P", fresh (Univ (fresh 1))), fresh (Var "P")) in
  let t' = Pi ((fresh "Q", fresh (Univ (fresh 1))), fresh (Var "Q")) in
  alpha_eq t t' []

let%test_unit "normal form: beta reduction" =
  let t =
    fresh
      (App
         ( fresh (Lam ((fresh "x", fresh (Var "X")), fresh (Var "x"))),
           fresh (Var "y") ))
  in
  let t' = fresh (Var "y") in
  [%test_result: term annotated] (normal_form t) ~expect:t'

let%test_unit "normal form: beta reduction under application" =
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
  [%test_result: term annotated] (normal_form t) ~expect:t'

let%test "type checking" =
  let t1 = fresh (Lam ((fresh "x", fresh (Var "X")), fresh (Var "x"))) in
  let t2 = term_fun (fresh (Var "X")) (fresh (Var "X")) in
  match ty t1 [] with Ok t2' -> alpha_eq t2'.el t2 [] | Error _ -> false

let%test_unit "type universe" =
  let t1 = fresh (term_fun (fresh (Var "X")) (fresh (Var "Y"))) in
  let t2 = fresh (term_fun (fresh (Univ (fresh 0))) (fresh (Univ (fresh 1)))) in
  let t3 = fresh (Univ (fresh 1)) in
  let t4 = fresh (Lam ((fresh "X", fresh (Univ (fresh 0))), fresh (Var "X"))) in
  [%test_result: int annotated]
    (Result.get_ok
       (univ_level t1
          [ ("X", fresh (Univ (fresh 0))); ("Y", fresh (Univ (fresh 0))) ]))
    ~expect:(fresh 0);
  [%test_result: int annotated]
    (Result.get_ok (univ_level t2 []))
    ~expect:(fresh 2);
  [%test_result: int annotated]
    (Result.get_ok (univ_level t3 []))
    ~expect:(fresh 2);
  [%test_result: string annotated]
    (Result.get_error (univ_level t4 []))
    ~expect:{ el = "This term is expected to be a type."; span = None }

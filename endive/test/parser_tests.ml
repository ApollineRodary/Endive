open Endive
open Endive.Stmt
open Endive.Term
open Endive.Span
open Sexplib.Std
open Ppx_compare_lib.Builtin

let parse s =
  let lexbuf = Lexing.from_string s in
  try Some (Parser.file Lexer.token lexbuf) with _ -> None

let%test_unit "parse natural number" =
  [%test_result: stmt list option] (parse "exact 2.")
    ~expect:
      (Some
         [
           Exact
             {
               el =
                 App
                   ( fresh (Var "S"),
                     fresh (App (fresh (Var "S"), fresh (Var "Z"))) );
               span =
                 Some
                   {
                     start = { line = 0; column = 6 };
                     end_ = { line = 0; column = 7 };
                   };
             };
         ])

let%test_unit "parse let" =
  [%test_result: stmt list option]
    (parse "let x : Type@{0}.")
    ~expect:
      (Some
         [
           Let
             ( {
                 el = "x";
                 span =
                   Some
                     {
                       start = { line = 0; column = 4 };
                       end_ = { line = 0; column = 5 };
                     };
               },
               {
                 el =
                   Univ
                     {
                       el = 0;
                       span =
                         Some
                           {
                             start = { line = 0; column = 14 };
                             end_ = { line = 0; column = 15 };
                           };
                     };
                 span =
                   Some
                     {
                       start = { line = 0; column = 8 };
                       end_ = { line = 0; column = 16 };
                     };
               } );
         ])

let%test_unit "parse exact" =
  [%test_result: stmt list option] (parse "exact x y.")
    ~expect:
      (Some
         [
           Exact
             {
               el =
                 App
                   ( {
                       el = Var "x";
                       span =
                         Some
                           {
                             start = { line = 0; column = 6 };
                             end_ = { line = 0; column = 7 };
                           };
                     },
                     {
                       el = Var "y";
                       span =
                         Some
                           {
                             start = { line = 0; column = 8 };
                             end_ = { line = 0; column = 9 };
                           };
                     } );
               span =
                 Some
                   {
                     start = { line = 0; column = 6 };
                     end_ = { line = 0; column = 9 };
                   };
             };
         ])

let%test_unit "parse lemma" =
  [%test_result: stmt list option]
    (parse "Lemma lemma : P. exact p. Qed.")
    ~expect:
      (Some
         [
           Lemma
             ( ( {
                   el = "lemma";
                   span =
                     Some
                       {
                         start = { line = 0; column = 6 };
                         end_ = { line = 0; column = 11 };
                       };
                 },
                 {
                   el = Var "P";
                   span =
                     Some
                       {
                         start = { line = 0; column = 14 };
                         end_ = { line = 0; column = 15 };
                       };
                 } ),
               [
                 Exact
                   {
                     el = Var "p";
                     span =
                       Some
                         {
                           start = { line = 0; column = 23 };
                           end_ = { line = 0; column = 24 };
                         };
                   };
               ] );
         ])

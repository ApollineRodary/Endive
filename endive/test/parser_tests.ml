open Endive
open Endive.Stmt
open Endive.Term

let parse s =
  let lexbuf = Lexing.from_string s in
  try Some (Parser.file Lexer.token lexbuf) with _ -> None

let%test "parse let" =
  parse "let x : Type@{0}."
  = Some
      [
        Let
          ( "x",
            {
              el = Univ 0;
              span =
                Some
                  {
                    start = { line = 0; column = 8 };
                    end_ = { line = 0; column = 16 };
                  };
            } );
      ]

let%test "parse exact" =
  parse "exact x y."
  = Some
      [
        Exact
          {
            el = App (Var "x", Var "y");
            span =
              Some
                {
                  start = { line = 0; column = 6 };
                  end_ = { line = 0; column = 9 };
                };
          };
      ]

let%test "parse lemma" =
  parse "Lemma lemma : P. exact p. Qed."
  = Some
      [
        Lemma
          ( ( "lemma",
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
      ]

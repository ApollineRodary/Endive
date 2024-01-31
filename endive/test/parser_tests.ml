open Endive
open Endive.Stmt
open Endive.Term
open Endive.Span

let parse s =
  let lexbuf = Lexing.from_string s in
  try Some (Parser.file Lexer.token lexbuf) with _ -> None

let%test "parse natural number" =
  parse "exact 2."
  = Some
      [
        Exact
          {
            el =
              App
                (fresh (Var "S"), fresh (App (fresh (Var "S"), fresh (Var "Z"))));
            span =
              Some
                {
                  start = { line = 0; column = 6 };
                  end_ = { line = 0; column = 7 };
                };
          };
      ]

let%test "parse let" =
  parse "let x : Type@{0}."
  = Some
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
      ]

let%test "parse exact" =
  parse "exact x y."
  = Some
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
      ]

let%test "parse lemma" =
  parse "Lemma lemma : P. exact p. Qed."
  = Some
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
      ]

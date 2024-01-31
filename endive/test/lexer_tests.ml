open Endive
open Endive.Parser

let lex s =
  let lexbuf = Lexing.from_string s in
  let rec loop tokens =
    let token = Lexer.token lexbuf in
    if token = EOF then List.rev tokens else loop (token :: tokens)
  in
  loop []

let%test "lex identifier" = lex "hi" = [ ID "hi" ]
let%test "ignore comments" = lex "hi // comment\nbye" = [ ID "hi"; ID "bye" ]

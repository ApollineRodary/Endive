open Endive
open Endive.Validate

let () =
  let spec = [] in
  let usage = "endive [ FILE ]" in
  let file = ref "-" in
  Arg.parse spec (fun s -> file := s) usage;
  let input = if !file = "-" then stdin else open_in !file in
  let lexbuf = Lexing.from_channel input in
  let stmts = Parser.file Endive.Lexer.token lexbuf in
  let errs = validate stmts in
  print_errors errs;
  if errs != [] then exit 1

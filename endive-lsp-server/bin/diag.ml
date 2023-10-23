let end_cursor_pos s =
  let line = ref 0 in
  let col = ref 0 in
  String.iter
    (fun c ->
      if c = '\n' then (
        incr line;
        col := 0)
      else incr col)
    s;
  (!line, !col)

let lsp_position_of_lexing (p : Lexing.position) : Lsp.Types.Position.t =
  let line = p.pos_lnum - 1 in
  let character = p.pos_cnum - p.pos_bol in
  Lsp.Types.Position.create ~line ~character

let lsp_position_of_endive (p : Endive.Span.pos) : Lsp.Types.Position.t =
  Lsp.Types.Position.create ~line:p.line ~character:p.column

let lsp_range_of_lexbuf (lexbuf : Lexing.lexbuf) =
  let start = lsp_position_of_lexing lexbuf.lex_start_p in
  let end_ = lsp_position_of_lexing lexbuf.lex_curr_p in
  Lsp.Types.Range.create ~start ~end_

let lsp_range_of_span (span : Endive.Span.span) =
  let start = lsp_position_of_endive span.start in
  let end_ = lsp_position_of_endive span.end_ in
  Lsp.Types.Range.create ~start ~end_

module I = Endive.Parser.MenhirInterpreter

let parse text =
  let lexbuf = Lexing.from_string text in
  let checkpoint = Endive.Parser.Incremental.file lexbuf.lex_curr_p in
  let rec aux checkpoint diags =
    match checkpoint with
    | I.InputNeeded _env -> (
        try
          let token = Endive.Lexer.token lexbuf in
          let start = lexbuf.lex_start_p in
          let end_ = lexbuf.lex_curr_p in
          let checkpoint = I.offer checkpoint (token, start, end_) in
          aux checkpoint diags
        with _ ->
          ( [],
            Lsp.Types.Diagnostic.create
              ~range:(lsp_range_of_lexbuf lexbuf)
              ~severity:Lsp.Types.DiagnosticSeverity.Error
              ?source:(Some "endive") ~message:"Syntax error." ()
            :: diags ))
    | I.Shifting _ | I.AboutToReduce _ ->
        let checkpoint = I.resume checkpoint in
        aux checkpoint diags
    | I.Accepted stmts -> (stmts, diags)
    | I.HandlingError _ | I.Rejected ->
        ( [],
          Lsp.Types.Diagnostic.create
            ~range:(lsp_range_of_lexbuf lexbuf)
            ~severity:Lsp.Types.DiagnosticSeverity.Error ?source:(Some "endive")
            ~message:"Syntax error." ()
          :: diags )
  in
  aux checkpoint []

let parse_and_compute_diags text =
  let stmts, diags = parse text in
  let errs = Endive.Validate.validate stmts in
  let diags =
    List.map
      (fun (err : string Endive.Span.annotated) ->
        let range =
          match err.span with
          | Some span -> lsp_range_of_span span
          | None ->
              let start = Lsp.Types.Position.create ~line:0 ~character:0 in
              let end_line, end_column = end_cursor_pos text in
              let end_ =
                Lsp.Types.Position.create ~line:end_line ~character:end_column
              in
              Lsp.Types.Range.create ~start ~end_
        in
        Lsp.Types.Diagnostic.create ~range
          ~severity:Lsp.Types.DiagnosticSeverity.Error ?source:(Some "endive")
          ~message:err.el ())
      errs
    @ diags
  in
  (stmts, diags)

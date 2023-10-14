module Fun = struct
  type 'a t = unit -> 'a

  let return x () = x
  let raise e () = raise e

  module O = struct
    let ( let+ ) x f () = f (x ())
    let ( let* ) x f = f (x ())
  end
end

module Io =
  Lsp.Io.Make
    (Fun)
    (struct
      type input = unit
      type output = unit

      let read_line () () = try Some (read_line ()) with End_of_file -> None

      let read_exactly () n () =
        let bytes = Bytes.create n in
        try
          really_input stdin bytes 0 n;
          Some (Bytes.to_string bytes)
        with End_of_file -> None

      let write () chunks () = List.iter print_string chunks
    end)

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

let lsp_pos_from_lexing (p : Lexing.position) : Lsp.Types.Position.t =
  let line = p.pos_lnum - 1 in
  let character = p.pos_cnum - p.pos_bol in
  Lsp.Types.Position.create ~line ~character

let lsp_range_from_lexbuf (lexbuf : Lexing.lexbuf) =
  let start = lsp_pos_from_lexing lexbuf.lex_start_p in
  let end_ = lsp_pos_from_lexing lexbuf.lex_curr_p in
  Lsp.Types.Range.create ~start ~end_

let lsp_pos_from_endive (p : Endive.Span.pos) : Lsp.Types.Position.t =
  Lsp.Types.Position.create ~line:p.line ~character:p.column

let lsp_range_from_span (span : Endive.Span.span) =
  let start = lsp_pos_from_endive span.start in
  let end_ = lsp_pos_from_endive span.end_ in
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
              ~range:(lsp_range_from_lexbuf lexbuf)
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
            ~range:(lsp_range_from_lexbuf lexbuf)
            ~severity:Lsp.Types.DiagnosticSeverity.Error ?source:(Some "endive")
            ~message:"Syntax error." ()
          :: diags )
  in
  aux checkpoint []

let publish_diags doc =
  let text = Lsp.Text_document.text doc in
  let stmts, diags = parse text in
  let diags =
    let errs = Endive.Validate.validate stmts in
    List.map
      (fun (err : string Endive.Span.annotated) ->
        let range =
          match err.span with
          | Some span -> lsp_range_from_span span
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
  let notif =
    Lsp.Server_notification.PublishDiagnostics
      (Lsp.Types.PublishDiagnosticsParams.create ~diagnostics:diags
         ~uri:(Lsp.Text_document.documentUri doc)
         ())
  in
  let notif = Lsp.Server_notification.to_jsonrpc notif in
  Io.write () (Jsonrpc.Packet.Notification notif) ()

let main () =
  let arg = Lsp.Cli.Arg.create () in
  let spec = Lsp.Cli.Arg.spec arg in
  let usage =
    "endive-lsp-server [ --stdio | --socket PORT | --port PORT | --pipe PIPE ] \
     [ --clientProcessId pid ]"
  in
  let _args =
    Arg.parse spec
      (fun _ -> raise (Arg.Bad "anonymous arguments are not allowed"))
      usage
  in
  let channel =
    match Lsp.Cli.Arg.channel arg with
    | Ok c -> c
    | Error s ->
        Format.eprintf "%s@.%!" s;
        Arg.usage spec usage;
        exit 1
  in
  if channel != Lsp.Cli.Channel.Stdio then (
    prerr_endline "only stdio is supported";
    exit 1);
  let docs = Hashtbl.create 2 in
  let rec main_loop () =
    (match Io.read () () with
    | Some (Jsonrpc.Packet.Request req) -> (
        match Lsp.Client_request.of_jsonrpc req with
        | Ok (E (Lsp.Client_request.Initialize _params)) ->
            let diag =
              `DiagnosticOptions
                (Lsp.Types.DiagnosticOptions.create ~interFileDependencies:false
                   ~workspaceDiagnostics:false ())
            in
            let sync =
              `TextDocumentSyncOptions
                (Lsp.Types.TextDocumentSyncOptions.create
                   ?change:(Some Lsp.Types.TextDocumentSyncKind.Incremental)
                   ~openClose:true ())
            in
            let caps =
              Lsp.Types.ServerCapabilities.create ?textDocumentSync:(Some sync)
                ?diagnosticProvider:(Some diag) ()
            in
            let res = Lsp.Types.InitializeResult.create ~capabilities:caps () in
            let resp =
              Jsonrpc.Response.ok req.id
                (Lsp.Types.InitializeResult.yojson_of_t res)
            in
            Io.write () (Jsonrpc.Packet.Response resp) ()
        | _ -> ())
    | Some (Jsonrpc.Packet.Notification notif) -> (
        match Lsp.Client_notification.of_jsonrpc notif with
        | Ok Lsp.Client_notification.Initialized -> ()
        | Ok (Lsp.Client_notification.TextDocumentDidOpen params) ->
            let doc = Lsp.Text_document.make ~position_encoding:`UTF8 params in
            Hashtbl.add docs params.textDocument.uri doc;
            publish_diags doc
        | Ok (Lsp.Client_notification.TextDocumentDidClose params) ->
            Hashtbl.remove docs params.textDocument.uri
        | Ok (Lsp.Client_notification.TextDocumentDidChange params) ->
            let doc = Hashtbl.find docs params.textDocument.uri in
            let doc =
              Lsp.Text_document.apply_content_changes doc params.contentChanges
            in
            Hashtbl.replace docs params.textDocument.uri doc;
            publish_diags doc
        | _ -> ())
    | _ -> ());
    main_loop ()
  in
  main_loop ()

let () = main ()

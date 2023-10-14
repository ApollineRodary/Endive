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

let pubish_diags doc =
  let text = Lsp.Text_document.text doc in
  let lexbuf = Lexing.from_string text in
  let diags =
    try
      let _ = Endive.Parser.file Endive.Lexer.token lexbuf in
      []
    with _ ->
      let pos = lexbuf.lex_start_p in
      let start_line = pos.pos_lnum - 1 in
      let start_column = pos.pos_cnum - pos.pos_bol in
      let end_line, end_column = end_cursor_pos text in
      [
        Lsp.Types.Diagnostic.create
          ~range:
            (Lsp.Types.Range.create
               ~start:
                 (Lsp.Types.Position.create ~line:start_line
                    ~character:start_column)
               ~end_:
                 (Lsp.Types.Position.create ~line:end_line ~character:end_column))
          ~severity:Lsp.Types.DiagnosticSeverity.Error ?source:(Some "endive")
          ~message:"syntax error" ();
      ]
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
            pubish_diags doc
        | Ok (Lsp.Client_notification.TextDocumentDidClose params) ->
            Hashtbl.remove docs params.textDocument.uri
        | Ok (Lsp.Client_notification.TextDocumentDidChange params) ->
            let doc = Hashtbl.find docs params.textDocument.uri in
            let doc =
              Lsp.Text_document.apply_content_changes doc params.contentChanges
            in
            Hashtbl.replace docs params.textDocument.uri doc;
            pubish_diags doc
        | _ -> ())
    | _ -> ());
    main_loop ()
  in
  main_loop ()

let () = main ()

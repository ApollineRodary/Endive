open Complete
open Diag
open Endive.Stmt

module Fun = struct
  type 'a t = unit -> 'a

  let return x () = x
  let raise e () = raise e

  module O = struct
    let ( let+ ) x f () = f (x ())
    let ( let* ) x f = f (x ())
  end
end

module Std_io =
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

type doc = { mutable text : Lsp.Text_document.t; mutable stmts : stmt list }

let parse_and_publish_diags doc =
  let text = Lsp.Text_document.text doc.text in
  let stmts, diags = parse_and_compute_diags text in
  let notif =
    Lsp.Server_notification.PublishDiagnostics
      (Lsp.Types.PublishDiagnosticsParams.create ~diagnostics:diags
         ~uri:(Lsp.Text_document.documentUri doc.text)
         ())
  in
  let notif = Lsp.Server_notification.to_jsonrpc notif in
  doc.stmts <- stmts;
  Std_io.write () (Jsonrpc.Packet.Notification notif) ()

let main_loop () =
  let docs = Hashtbl.create 2 in
  while true do
    match Std_io.read () () with
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
            let completion = Lsp.Types.CompletionOptions.create () in
            let caps =
              Lsp.Types.ServerCapabilities.create ?textDocumentSync:(Some sync)
                ?diagnosticProvider:(Some diag)
                ?completionProvider:(Some completion) ()
            in
            let res = Lsp.Types.InitializeResult.create ~capabilities:caps () in
            let resp =
              Jsonrpc.Response.ok req.id
                (Lsp.Types.InitializeResult.yojson_of_t res)
            in
            Std_io.write () (Jsonrpc.Packet.Response resp) ()
        | Ok (E (Lsp.Client_request.TextDocumentCompletion params)) ->
            let doc = Hashtbl.find docs params.textDocument.uri in
            let completions = compute_completions params.position doc.stmts in
            let resp =
              Jsonrpc.Response.ok req.id
                (Lsp.Types.CompletionList.yojson_of_t completions)
            in
            Std_io.write () (Jsonrpc.Packet.Response resp) ()
        | _ -> ())
    | Some (Jsonrpc.Packet.Notification notif) -> (
        match Lsp.Client_notification.of_jsonrpc notif with
        | Ok Lsp.Client_notification.Initialized -> ()
        | Ok (Lsp.Client_notification.TextDocumentDidOpen params) ->
            let doc =
              {
                text = Lsp.Text_document.make ~position_encoding:`UTF8 params;
                stmts = [];
              }
            in
            Hashtbl.add docs params.textDocument.uri doc;
            parse_and_publish_diags doc
        | Ok (Lsp.Client_notification.TextDocumentDidClose params) ->
            Hashtbl.remove docs params.textDocument.uri
        | Ok (Lsp.Client_notification.TextDocumentDidChange params) ->
            let doc = Hashtbl.find docs params.textDocument.uri in
            doc.text <-
              Lsp.Text_document.apply_content_changes doc.text
                params.contentChanges;
            Hashtbl.replace docs params.textDocument.uri doc;
            parse_and_publish_diags doc
        | _ -> ())
    | _ -> ()
  done

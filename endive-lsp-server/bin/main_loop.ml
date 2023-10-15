open Diag

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

let publish_diags doc =
  let diags = compute_diags doc in
  let notif =
    Lsp.Server_notification.PublishDiagnostics
      (Lsp.Types.PublishDiagnosticsParams.create ~diagnostics:diags
         ~uri:(Lsp.Text_document.documentUri doc)
         ())
  in
  let notif = Lsp.Server_notification.to_jsonrpc notif in
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
            let caps =
              Lsp.Types.ServerCapabilities.create ?textDocumentSync:(Some sync)
                ?diagnosticProvider:(Some diag) ()
            in
            let res = Lsp.Types.InitializeResult.create ~capabilities:caps () in
            let resp =
              Jsonrpc.Response.ok req.id
                (Lsp.Types.InitializeResult.yojson_of_t res)
            in
            Std_io.write () (Jsonrpc.Packet.Response resp) ()
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
    | _ -> ()
  done

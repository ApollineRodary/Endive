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

let main () =
  let arg = Lsp.Cli.Arg.create () in
  let spec = Lsp.Cli.Arg.spec arg in
  let usage =
    "endive [ --stdio | --socket PORT | --port PORT | --pipe PIPE ] [ \
     --clientProcessId pid ]"
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
                (Lsp.Types.TextDocumentSyncOptions.create ~openClose:true ())
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
            let diags =
              [
                Lsp.Types.Diagnostic.create
                  ~range:
                    (Lsp.Types.Range.create
                       ~start:(Lsp.Types.Position.create ~line:0 ~character:0)
                       ~end_:(Lsp.Types.Position.create ~line:0 ~character:10))
                  ~severity:Lsp.Types.DiagnosticSeverity.Error
                  ?source:(Some "endive") ~message:"test" ();
              ]
            in
            let notif =
              Lsp.Server_notification.PublishDiagnostics
                (Lsp.Types.PublishDiagnosticsParams.create ~diagnostics:diags
                   ~uri:params.textDocument.uri ())
            in
            let notif = Lsp.Server_notification.to_jsonrpc notif in
            Io.write () (Jsonrpc.Packet.Notification notif) ()
        | Ok (Lsp.Client_notification.TextDocumentDidClose _params) -> ()
        | _ -> ())
    | _ -> ());
    main_loop ()
  in
  main_loop ()

let () = main ()

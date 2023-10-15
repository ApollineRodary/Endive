open Main_loop

let () =
  let arg = Lsp.Cli.Arg.create () in
  let spec = Lsp.Cli.Arg.spec arg in
  let usage =
    "endive-lsp-server [ --stdio | --socket PORT | --port PORT | --pipe PIPE ] \
     [ --clientProcessId PID ]"
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
  main_loop ()

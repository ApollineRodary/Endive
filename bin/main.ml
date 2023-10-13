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
    match Io.read () () with
    | Some _req ->
        print_endline "read request";
        main_loop ()
    | None -> ()
  in
  main_loop ()

let () = main ()

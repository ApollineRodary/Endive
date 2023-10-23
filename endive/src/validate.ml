open Span
open Term

let validate stmts =
  let rec aux stmts env proven errs goal =
    match stmts with
    | [] -> (
        match goal with
        | Some goal when not (List.exists (fun t -> sub_ty goal.el t []) proven)
          ->
            { el = "The goal is not proven."; span = goal.span } :: errs
        | _ -> errs)
    | Stmt.Lemma ((x, t), stmts) :: rest -> (
        match Term.ty t env with
        | Ok _ ->
            let t' = map Term.normal_form t in
            let errs = aux stmts env proven errs (Some t') in
            let env = (x.el, t') :: env in
            aux rest env proven errs goal
        | Error e -> aux rest env proven (e :: errs) goal)
    | Stmt.Let (x, t1) :: rest -> (
        match Term.ty t1 env with
        | Ok _ -> (
            let t1' = map Term.normal_form t1 in
            match goal with
            | Some { el = Term.Pi ((_x', t2), goal'); span = _ }
              when sub_ty t2.el t1'.el [] ->
                let_ rest env proven errs (Some goal') x.el t1'
            | Some { el = goal; span = _ } ->
                [
                  {
                    el =
                      "Let type does not match the current goal ("
                      ^ Term.string_of_term goal ^ ").";
                    span = t1.span;
                  };
                ]
            | None -> let_ rest env proven errs None x.el t1')
        | Error e -> [ e ])
    | Stmt.Exact t :: rest -> (
        match Term.ty t env with
        | Ok t1 -> aux rest env (t1.el :: proven) errs goal
        | Error e -> aux rest env proven (e :: errs) goal)
  and let_ rest env proven errs goal x t =
    let env = (x, t) :: env in
    aux rest env proven errs goal
  in
  aux stmts [] [] [] None

let rec print_errors errs =
  match errs with
  | [] -> ()
  | { el; span } :: rest ->
      (match span with
      | Some span ->
          Printf.eprintf "%d:%d: %s\n" (span.start.line + 1)
            (span.start.column + 1) el
      | None -> prerr_endline el);
      print_errors rest

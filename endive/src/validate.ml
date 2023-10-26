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
        match Term.ty t.el env with
        | Some _ ->
            let t' = Term.normal_form t.el in
            let errs =
              aux stmts env proven errs (Some { el = t'; span = t.span })
            in
            let env = (x, t') :: env in
            aux rest env proven errs goal
        | None ->
            aux rest env proven
              ({ el = "The lemma goal is invalid."; span = t.span } :: errs)
              goal)
    | Stmt.Let (x, t1) :: rest -> (
        match Term.ty t1.el env with
        | Some _ -> (
            let t1' = Term.normal_form t1.el in
            match goal with
            | Some { el = Term.Pi ((_x', t2), goal'); span }
              when sub_ty t2 t1' [] ->
                let_ rest env proven errs (Some { el = goal'; span }) x t1'
            | Some { el = goal; span = _ } ->
                [
                  {
                    el =
                      "Let type does not match the current goal ("
                      ^ Term.string_of_term goal ^ ").";
                    span = t1.span;
                  };
                ]
            | None -> let_ rest env proven errs None x t1')
        | None -> [ { el = "Invalid type in let."; span = t1.span } ])
    | Stmt.Exact t :: rest -> (
        match Term.ty t.el env with
        | Some t1 -> aux rest env (t1 :: proven) errs goal
        | None ->
            aux rest env proven
              ({ el = "Invalid term in exact."; span = t.span } :: errs)
              goal)
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
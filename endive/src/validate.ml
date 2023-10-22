open Span
open Stmt
open Term

let validate stmts =
  let rec aux stmts env proven defs errs goal =
    match stmts with
    | [] -> (
        match goal with
        | Some goal when not (List.exists (fun t -> sub_ty goal.el t []) proven)
          ->
            { el = "The goal is not proven."; span = goal.span } :: errs
        | _ -> errs)
    | Lemma ((x, t), stmts) :: rest -> (
        let t' = subst_many t.el defs in
        match ty t' env with
        | Some _ ->
            let t' = normal_form t' in
            let errs =
              aux stmts env proven defs errs (Some { el = t'; span = t.span })
            in
            let env = (x, t') :: env in
            aux rest env proven defs errs goal
        | None ->
            aux rest env proven defs
              ({ el = "The lemma goal is invalid."; span = t.span } :: errs)
              goal)
    | Let (x, t) :: rest -> (
        let t' = subst_many t.el defs in
        match ty t' env with
        | Some _ -> (
            let t' = normal_form t' in
            match goal with
            | Some { el = Pi ((_x', u), goal'); span } when sub_ty u t' [] ->
                let_ rest env proven defs errs (Some { el = goal'; span }) x t'
            | Some { el = goal; span = _ } ->
                [
                  {
                    el =
                      "Let type does not match the current goal ("
                      ^ string_of_term goal ^ ").";
                    span = t.span;
                  };
                ]
            | None -> let_ rest env proven defs errs None x t')
        | None -> [ { el = "Invalid type in let."; span = t.span } ])
    | Def (x, t) :: rest -> (
        let t' = subst_many t.el defs in
        match ty t' env with
        | Some _ -> aux rest env proven ((x, t') :: defs) errs goal
        | None ->
            aux rest env proven defs
              ({ el = "Invalid term in def."; span = t.span } :: errs)
              goal)
    | Exact t :: rest -> (
        let t' = subst_many t.el defs in
        match ty t' env with
        | Some t1 -> aux rest env (t1 :: proven) defs errs goal
        | None ->
            aux rest env proven defs
              ({ el = "Invalid term in exact."; span = t.span } :: errs)
              goal)
  and let_ rest env proven defs errs goal x t =
    let env = (x, t) :: env in
    aux rest env proven defs errs goal
  in
  aux stmts [] [] [] [] None

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

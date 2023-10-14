open Span
open Term

let validate stmts =
  let rec aux stmts env proved errs goal =
    match stmts with
    | [] -> (
        match goal with
        | Some goal when not (List.exists (fun t -> sub_ty goal.el t []) proved)
          ->
            { el = "The goal is not proved."; span = goal.span } :: errs
        | _ -> errs)
    | Stmt.Lemma ((x, t), stmts) :: rest -> (
        match Term.ty t.el env with
        | Some _ ->
            let t' = Term.normal_form t.el in
            let errs =
              aux stmts env proved errs (Some { el = t'; span = t.span })
            in
            let env = (x, t') :: env in
            aux rest env proved errs goal
        | None ->
            aux rest env proved
              ({ el = "The lemma goal is invalid."; span = t.span } :: errs)
              goal)
    | Stmt.Let (x, t1) :: rest -> (
        match Term.ty t1.el env with
        | Some _ -> (
            let t1' = Term.normal_form t1.el in
            match goal with
            | Some { el = Term.Pi ((_x', t2), goal'); span }
              when sub_ty t2 t1' [] ->
                let_ rest env proved errs (Some { el = goal'; span }) x t1'
            | Some { el = goal; span = _ } ->
                [
                  {
                    el =
                      "Let type does not match the current goal ("
                      ^ Term.to_string goal ^ ").";
                    span = t1.span;
                  };
                ]
            | None -> let_ rest env proved errs None x t1')
        | None -> [ { el = "Invalid type in let."; span = t1.span } ])
    | Stmt.Exact t :: rest -> (
        match Term.ty t.el env with
        | Some t1 -> aux rest env (t1 :: proved) errs goal
        | None ->
            aux rest env proved
              ({ el = "Invalid term in exact."; span = t.span } :: errs)
              goal)
  and let_ rest env proved errs goal x t =
    let env = (x, t) :: env in
    aux rest env proved errs goal
  in
  aux stmts [] [] [] None

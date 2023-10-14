let validate stmts =
  let rec aux stmts env proved errs goal =
    match stmts with
    | [] -> (
        match goal with
        | Some t when not (List.exists (fun t' -> Term.sub_ty t t' []) proved)
          ->
            "target not proved" :: errs
        | _ -> errs)
    | Stmt.Lemma ((x, t), stmts) :: rest -> (
        match Term.ty t env with
        | Some _ ->
            let t' = Term.normal_form t in
            let errs = aux stmts env proved errs (Some t') in
            let env = (x, t') :: env in
            aux rest env proved errs goal
        | None -> aux rest env proved ("lemma goal is invalid" :: errs) goal)
    | Stmt.Let (x, t1) :: rest -> (
        match Term.ty t1 env with
        | Some _ -> (
            let t1' = Term.normal_form t1 in
            match goal with
            | Some (Term.Pi ((_x', t2), goal')) when Term.sub_ty t2 t1' [] ->
                let_ rest env proved errs (Some goal') x t1'
            | Some goal ->
                [
                  "let type \"" ^ Term.to_string t1'
                  ^ "\" does not match goal \"" ^ Term.to_string goal ^ "\"";
                ]
            | None -> let_ rest env proved errs None x t1')
        | None -> [ "let with invalid type: " ^ Term.to_string t1 ])
    | Stmt.Exact t :: rest -> (
        match Term.ty t env with
        | Some t1 -> aux rest env (t1 :: proved) errs goal
        | None -> aux rest env proved ("exact term is invalid" :: errs) goal)
  and let_ rest env proved errs goal x t =
    let env = (x, t) :: env in
    aux rest env proved errs goal
  in
  aux stmts [] [] [] None

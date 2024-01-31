open Span
open Stmt
open Term

let validate stmts =
  let rec currify args body =
    match args with tl :: hd -> fresh (Pi (tl, currify hd body)) | [] -> body
  in
  let bind bindings env =
    let rec aux bindings normal_forms env =
      match bindings with
      | [] -> Ok (env, normal_forms)
      | (x, t) :: rest -> (
          match ty t env with
          | Ok _ ->
              let t' = normal_form t in
              aux rest ((x, t') :: normal_forms) ((x.el, t') :: env)
          | Error e -> Error e)
    in
    aux bindings [] env
  in
  let rec decl_constructors env params constructors constructors_env =
    match constructors with
    | [] -> Ok env
    | (x, t) :: rest -> (
        match ty t constructors_env with
        | Ok _ ->
            let t' = currify params (normal_form t) in
            let env = (x.el, t') :: env in
            decl_constructors env params rest constructors_env
        | Error e -> Error e)
  in
  let rec aux stmts env proven defs errs goal =
    match stmts with
    | [] -> (
        match goal with
        | Some goal when not (List.exists (fun t -> sub_ty goal.el t []) proven)
          ->
            { el = "The goal is not proven."; span = goal.span } :: errs
        | _ -> errs)
    | Def (x, t) :: rest -> (
        let unannotated_defs = List.map (fun (x, t) -> (x, t.el)) defs in
        let t' = subst_many unannotated_defs t in
        match ty t' env with
        | Ok _ -> aux rest env proven ((x.el, t') :: defs) errs goal
        | Error e -> aux rest env proven defs (e :: errs) goal)
    | Exact t :: rest -> (
        match ty t env with
        | Ok t1 -> aux rest env (t1.el :: proven) defs errs goal
        | Error e -> aux rest env proven defs (e :: errs) goal)
    | Inductive (signature, constructors) :: rest -> (
        match bind signature.params env with
        | Ok (t_env, params) -> (
            match ty signature.ty t_env with
            | Ok _ -> (
                let t = normal_form signature.ty in
                let env = (signature.name.el, currify params t) :: env in
                let constructors_env = (signature.name.el, t) :: t_env in
                match
                  decl_constructors env params constructors constructors_env
                with
                | Ok env -> aux rest env proven defs errs goal
                | Error e -> aux rest env proven defs (e :: errs) goal)
            | Error e -> aux rest env proven defs (e :: errs) goal)
        | Error e -> aux rest env proven defs (e :: errs) goal)
    | Lemma ((x, t), stmts) :: rest -> (
        match ty t env with
        | Ok _ ->
            let t' = normal_form t in
            let errs = aux stmts env proven defs errs (Some t') in
            let env = (x.el, t') :: env in
            aux rest env proven defs errs goal
        | Error e -> aux rest env proven defs (e :: errs) goal)
    | Let (x, t1) :: rest -> (
        match ty t1 env with
        | Ok _ -> (
            let t1' = normal_form t1 in
            match goal with
            | Some { el = Pi ((_x', t2), goal'); span = _ }
              when sub_ty t2.el t1'.el [] ->
                let_ rest env proven defs errs (Some goal') x.el t1'
            | Some { el = goal; span = _ } ->
                [
                  {
                    el =
                      "Let type does not match the current goal ("
                      ^ string_of_term goal ^ ").";
                    span = t1.span;
                  };
                ]
            | None -> let_ rest env proven defs errs None x.el t1')
        | Error e -> [ e ])
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

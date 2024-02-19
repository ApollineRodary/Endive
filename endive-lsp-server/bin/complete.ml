open Endive.Term
open Endive.Span
open Endive.Stmt

let rec find_map_term f env stmts =
  match stmts with
  | [] -> None
  | stmt :: rest -> (
      match stmt with
      | Def (x, t) -> (
          match f t env with
          | Some res -> Some res
          | None -> (
              match ty t env with
              | Ok t1 -> find_map_term f ((x.el, t1) :: env) rest
              | Error _ -> find_map_term f ((x.el, t) :: env) rest))
      | Exact t -> (
          match f t env with
          | Some res -> Some res
          | None -> find_map_term f env rest)
      | Inductive (s, constructors) -> (
          match f s.ty env with
          | Some res -> Some res
          | None -> (
              match List.find_map (fun (_x, t1) -> f t1 env) s.params with
              | Some res -> Some res
              | None -> (
                  match
                    List.find_map (fun (_x, t1) -> f t1 env) constructors
                  with
                  | Some res -> Some res
                  | None -> find_map_term f env rest)))
      | Lemma ((x, t), stmts) -> (
          match f t env with
          | Some res -> Some res
          | None -> (
              match find_map_term f env stmts with
              | Some res -> Some res
              | None -> find_map_term f ((x.el, t) :: env) rest))
      | Let (x, t) -> (
          match f t env with
          | Some res -> Some res
          | None -> find_map_term f ((x.el, t) :: env) rest))

let inside_term (pos : Lsp.Types.Position.t) (t : term annotated) =
  match t.span with
  | Some s ->
      pos.line >= s.start.line && pos.line <= s.end_.line
      && pos.character >= s.start.column
      && pos.character <= s.end_.column
  | None -> false

let complete env x =
  let rec aux env acc =
    match env with
    | [] -> acc
    | (y, t) :: rest ->
        if String.starts_with ~prefix:x y then
          let detail = string_of_term t.el in
          let completion =
            Lsp.Types.CompletionItem.create ?detail:(Some detail) ~label:y ()
          in
          aux rest (completion :: acc)
        else aux rest acc
  in
  aux env []

let complete_in_term (pos : Lsp.Types.Position.t) (t : term annotated)
    (env : (string * term annotated) list) =
  let rec aux t env =
    if inside_term pos t then
      match t.el with
      | Var x -> Some (complete env x)
      | Lam ((x, t1), t2) | Pi ((x, t1), t2) -> (
          match aux t1 env with
          | Some res -> Some res
          | None -> aux t2 ((x.el, t1) :: env))
      | App (t1, t2) -> (
          match aux t1 env with Some res -> Some res | None -> aux t2 env)
      | Univ _ -> None
    else None
  in
  aux t env

let compute_completions (pos : Lsp.Types.Position.t) (stmts : stmt list) =
  let items =
    Option.value ~default:[] (find_map_term (complete_in_term pos) [] stmts)
  in
  Lsp.Types.CompletionList.create ~isIncomplete:false ~items ()

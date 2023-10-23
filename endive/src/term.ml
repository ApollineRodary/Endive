open Span

type term =
  | Var of string
  | Lam of annotated_binding * term annotated
  | App of term annotated * term annotated
  | Pi of annotated_binding * term annotated
  | Univ of int annotated

and annotated_binding = string annotated * term annotated

let term_fun t1 t2 = Pi ((fresh "_", t1), t2)
let term_not t = term_fun t (fresh (Var "False"))

let rec subst t x u =
  match t with
  | Var y when y = x -> u
  | Lam ((y, t1), t2) when y.el != x ->
      Lam ((y, t1), map (fun t2 -> subst t2 x u) t2)
  | App (t1, t2) ->
      App (map (fun t1 -> subst t1 x u) t1, map (fun t2 -> subst t2 x u) t2)
  | Pi ((y, t1), t2) when y.el != x ->
      Pi ((y, t1), map (fun t2 -> subst t2 x u) t2)
  | _ -> t

let rec alpha_eq t u map =
  match (t, u) with
  | Var x, Var x' ->
      let x = Option.value ~default:x (List.assoc_opt x map) in
      x = x'
  | Lam ((x, t1), t2), Lam ((x', t1'), t2') ->
      alpha_eq t1.el t1'.el map && alpha_eq t2.el t2'.el ((x.el, x'.el) :: map)
  | App (t, u), App (v, w) -> alpha_eq t.el v.el map && alpha_eq u.el w.el map
  | Pi ((x, t1), t2), Pi ((x', t1'), t2') ->
      alpha_eq t1.el t1'.el map && alpha_eq t2.el t2'.el ((x.el, x'.el) :: map)
  | Univ n, Univ m -> n = m
  | _ -> false

let rec sub_ty t u map =
  match (t, u) with
  | Pi ((x, t1), t2), Pi ((x', t1'), t2') ->
      sub_ty t1'.el t1.el map && sub_ty t2.el t2'.el ((x.el, x'.el) :: map)
  | Univ n, Univ m -> n <= m
  | _ -> alpha_eq t u map

let rec normal_form t =
  match t with
  | Lam ((x, t1), t2) -> Lam ((x, map normal_form t1), map normal_form t2)
  | App (t1, t2) -> (
      let t1' = map normal_form t1 in
      let t2' = map normal_form t2 in
      match t1'.el with
      | Lam ((x, _), t3) -> normal_form (subst t3.el x.el t2'.el)
      | _ -> App (t1', t2'))
  | Pi ((x, t1), t2) -> Pi ((x, map normal_form t1), map normal_form t2)
  | _ -> t

let rec ty t env =
  match t.el with
  | Var x -> (
      match List.assoc_opt x env with Some t1 -> Ok t1 | None -> Error t.span)
  | Lam ((x, t1), t2) -> (
      match ty t2 ((x.el, t1) :: env) with
      | Ok t3 -> Ok (fresh (Pi ((x, t1), t3)))
      | Error e -> Error e)
  | App (t1, t2) -> (
      match (ty t1 env, ty t2 env) with
      | Error e, _ -> Error e
      | _, Error e -> Error e
      | Ok { el = Pi ((x, t3), t4); span = _ }, Ok t5 ->
          let t3' = normal_form t3.el in
          let t5' = normal_form t5.el in
          if sub_ty t5' t3' [] then
            Ok (fresh (normal_form (subst t4.el x.el t5')))
          else Error t5.span
      | Ok { el = _; span }, _ -> Error span)
  | Pi ((x, t1), t2) -> (
      match (univ_level t1 env, univ_level t2 ((x.el, t1) :: env)) with
      | Ok t3, Ok t4 ->
          if t3.el >= t4.el then Ok (fresh (Univ t3)) else Ok (fresh (Univ t4))
      | Error e, _ -> Error e
      | _, Error e -> Error e)
  | Univ n -> Ok (fresh (Univ (fresh (n.el + 1))))

and univ_level t env =
  match ty t env with
  | Ok { el = Univ n; span = _ } -> Ok n
  | Ok _ -> Error t.span
  | Error e -> Error e

let string_of_term t =
  let rec aux t ~paren_around_app ~paren_around_arrow ~paren_around_lam =
    match t with
    | Var x -> x
    | Lam ((x, t1), t2) ->
        let l, r = if paren_around_lam then ("(", ")") else ("", "") in
        let s1 =
          aux t1.el ~paren_around_app:false ~paren_around_arrow:false
            ~paren_around_lam:false
        in
        let s2 =
          aux t2.el ~paren_around_app:false ~paren_around_arrow:false
            ~paren_around_lam:true
        in
        Printf.sprintf "%sfun %s : %s => %s%s" l x.el s1 s2 r
    | App (t1, t2) ->
        let l, r = if paren_around_app then ("(", ")") else ("", "") in
        let s1 =
          aux t1.el ~paren_around_app:false ~paren_around_arrow:true
            ~paren_around_lam:true
        in
        let s2 =
          aux t2.el ~paren_around_app:true ~paren_around_arrow:true
            ~paren_around_lam:false
        in
        Printf.sprintf "%s%s %s%s" l s1 s2 r
    | Pi ((_x, t1), { el = Var "False"; span = _ }) ->
        "~"
        ^ aux t1.el ~paren_around_app:true ~paren_around_arrow:true
            ~paren_around_lam:true
    | Pi (({ el = "_"; span = _ }, t1), t2) ->
        let l, r = if paren_around_arrow then ("(", ")") else ("", "") in
        let s1 =
          aux t1.el ~paren_around_app:false ~paren_around_arrow:true
            ~paren_around_lam:true
        in
        let s2 =
          aux t2.el ~paren_around_app:false ~paren_around_arrow:false
            ~paren_around_lam:true
        in
        Printf.sprintf "%s%s -> %s%s" l s1 s2 r
    | Pi ((x, t1), t2) ->
        let l, r = if paren_around_lam then ("(", ")") else ("", "") in
        let s1 =
          aux t1.el ~paren_around_app:false ~paren_around_arrow:false
            ~paren_around_lam:false
        in
        let s2 =
          aux t2.el ~paren_around_app:false ~paren_around_arrow:false
            ~paren_around_lam:false
        in
        Printf.sprintf "%sforall %s : %s, %s%s" l x.el s1 s2 r
    | Univ n -> Printf.sprintf "Type@{%d}" n.el
  in
  aux t ~paren_around_app:false ~paren_around_arrow:false
    ~paren_around_lam:false

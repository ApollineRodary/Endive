type term =
  | Var of string
  | Lam of binding * term
  | App of term * term
  | Pi of binding * term
  | Univ of int

and binding = string * term

type env = binding list

let term_fun t1 t2 = Pi (("_", t1), t2)
let term_not t = term_fun t (Var "False")

let rec subst t x u =
  match t with
  | Var y when y = x -> u
  | Lam ((y, t1), t2) when y != x -> Lam ((y, t1), subst t2 x u)
  | App (t1, t2) -> App (subst t1 x u, subst t2 x u)
  | Pi ((y, t1), t2) when y != x -> Pi ((y, t1), subst t2 x u)
  | _ -> t

let rec alpha_eq t u map =
  match (t, u) with
  | Var x, Var x' ->
      let x = Option.value ~default:x (List.assoc_opt x map) in
      x = x'
  | Lam ((x, t1), t2), Lam ((x', t1'), t2') ->
      alpha_eq t1 t1' map && alpha_eq t2 t2' ((x, x') :: map)
  | App (t, u), App (v, w) -> alpha_eq t v map && alpha_eq u w map
  | Pi ((x, t1), t2), Pi ((x', t1'), t2') ->
      alpha_eq t1 t1' map && alpha_eq t2 t2' ((x, x') :: map)
  | Univ n, Univ m -> n = m
  | _ -> false

let rec sub_ty t u map =
  match (t, u) with
  | Pi ((x, t1), t2), Pi ((x', t1'), t2') ->
      sub_ty t1' t1 map && sub_ty t2 t2' ((x, x') :: map)
  | Univ n, Univ m -> n <= m
  | _ -> alpha_eq t u map

let rec normal_form t =
  match t with
  | Lam ((x, t1), t2) -> Lam ((x, normal_form t1), normal_form t2)
  | App (t1, t2) -> (
      let t1' = normal_form t1 in
      let t2' = normal_form t2 in
      match t1' with
      | Lam ((x, _t3), t4) -> normal_form (subst t4 x t2')
      | _ -> t1)
  | Pi ((x, t1), t2) -> Pi ((x, normal_form t1), normal_form t2)
  | _ -> t

let rec ty t env =
  match t with
  | Var x -> List.assoc_opt x env
  | Lam ((x, t1), t2) -> (
      match ty t2 ((x, t1) :: env) with
      | Some t3 -> Some (Pi ((x, t1), t3))
      | None -> None)
  | App (t1, t2) -> (
      match (ty t1 env, ty t2 env) with
      | Some (Pi ((x, t3), t4)), Some t5 ->
          let t3' = normal_form t3 in
          let t5' = normal_form t5 in
          if sub_ty t5' t3' [] then Some (normal_form (subst t4 x t5'))
          else None
      | _ -> None)
  | Pi ((x, t1), t2) -> (
      match (univ_level t1 env, univ_level t2 ((x, t1) :: env)) with
      | Some t3, Some t4 -> Some (Univ (max t3 t4))
      | _ -> None)
  | Univ n -> Some (Univ (n + 1))

and univ_level t env =
  match ty t env with
  | Some t1 -> ( match normal_form t1 with Univ n -> Some n | _ -> None)
  | _ -> None

let string_of_term t =
  let rec aux t ~paren_around_app ~paren_around_arrow ~paren_around_lam =
    match t with
    | Var x -> x
    | Lam ((x, t1), t2) ->
        let l, r = if paren_around_lam then ("(", ")") else ("", "") in
        let s1 =
          aux t1 ~paren_around_app:false ~paren_around_arrow:false
            ~paren_around_lam:false
        in
        let s2 =
          aux t2 ~paren_around_app:false ~paren_around_arrow:false
            ~paren_around_lam:true
        in
        Printf.sprintf "%sfun %s : %s => %s%s" l x s1 s2 r
    | App (t1, t2) ->
        let l, r = if paren_around_app then ("(", ")") else ("", "") in
        let s1 =
          aux t1 ~paren_around_app:false ~paren_around_arrow:true
            ~paren_around_lam:true
        in
        let s2 =
          aux t2 ~paren_around_app:true ~paren_around_arrow:true
            ~paren_around_lam:false
        in
        Printf.sprintf "%s%s %s%s" l s1 s2 r
    | Pi ((_x, t1), Var "False") ->
        "~"
        ^ aux t1 ~paren_around_app:true ~paren_around_arrow:true
            ~paren_around_lam:true
    | Pi (("_", t1), t2) ->
        let l, r = if paren_around_arrow then ("(", ")") else ("", "") in
        let s1 =
          aux t1 ~paren_around_app:false ~paren_around_arrow:true
            ~paren_around_lam:true
        in
        let s2 =
          aux t2 ~paren_around_app:false ~paren_around_arrow:false
            ~paren_around_lam:true
        in
        Printf.sprintf "%s%s -> %s%s" l s1 s2 r
    | Pi ((x, t1), t2) ->
        let l, r = if paren_around_lam then ("(", ")") else ("", "") in
        let s1 =
          aux t1 ~paren_around_app:false ~paren_around_arrow:false
            ~paren_around_lam:false
        in
        let s2 =
          aux t2 ~paren_around_app:false ~paren_around_arrow:false
            ~paren_around_lam:false
        in
        Printf.sprintf "%sforall %s : %s, %s%s" l x s1 s2 r
    | Univ n -> Printf.sprintf "Type@{%d}" n
  in
  aux t ~paren_around_app:false ~paren_around_arrow:false
    ~paren_around_lam:false

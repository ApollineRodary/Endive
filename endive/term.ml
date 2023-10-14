type term =
  | Var of string
  | Lam of binding * term
  | App of term * term
  | Pi of binding * term
  | Univ of int

and binding = string * term

type env = binding list

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
  | Pi ((x, t1), t2), Lam ((x', t1'), t2') ->
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
  | Lam ((x, t1), t2) -> (
      match normal_form t1 with
      | Some t1' -> (
          match normal_form t2 with
          | Some t2' -> Some (Lam ((x, t1'), t2'))
          | None -> None)
      | None -> None)
  | App (Lam ((x, _t1), t2), u) -> normal_form (subst t2 x u)
  | App _ -> None
  | Pi ((x, t1), t2) -> (
      match (normal_form t1, normal_form t2) with
      | Some t1', Some t2' -> Some (Pi ((x, t1'), t2'))
      | _ -> None)
  | _ -> Some t

let rec ty t env =
  match t with
  | Var x -> List.assoc_opt x env
  | Lam ((x, t1), t2) -> (
      match ty t2 ((x, t1) :: env) with
      | Some t3 -> Some (Pi ((x, t1), t3))
      | None -> None)
  | App (t1, t2) -> (
      match (ty t1 env, ty t2 env) with
      | Some (Pi ((x, t3), t4)), Some t5 -> (
          match (normal_form t3, normal_form t5) with
          | Some t3', Some t5' when sub_ty t5' t3' [] -> Some (subst t4 x t5')
          | _ -> None)
      | _ -> None)
  | Pi ((x, t1), t2) -> (
      match (univ_level t1 env, univ_level t2 ((x, t1) :: env)) with
      | Some t3, Some t4 -> Some (Univ (max t3 t4))
      | _ -> None)
  | Univ n -> Some (Univ (n + 1))

and univ_level t env =
  match ty t env with
  | Some t1 -> (
      match normal_form t1 with Some (Univ n) -> Some n | _ -> None)
  | _ -> None

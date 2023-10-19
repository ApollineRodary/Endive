type term =
  | App of term * term
  | Lam of binding * term
  | Pi of binding * term
  | Sup of term * term
  | Univ of int
  | Var of string
  | W of binding * term
  | WRec of term * term * term

and binding = string * term

type env = binding list

let term_fun t1 t2 = Pi (("_", t1), t2)
let term_not t = term_fun t (Var "False")

let rec unsafe_subst t x u =
  match t with
  | App (t1, t2) -> App (unsafe_subst t1 x u, unsafe_subst t2 x u)
  | Lam ((y, t1), t2) ->
      let t1 = unsafe_subst t1 x u in
      let t2 = if x = y then t2 else unsafe_subst t2 x u in
      Lam ((y, t1), t2)
  | Pi ((y, t1), t2) ->
      let t1 = unsafe_subst t1 x u in
      let t2 = if x = y then t2 else unsafe_subst t2 x u in
      Pi ((y, t1), t2)
  | Sup (t1, t2) -> Sup (unsafe_subst t1 x u, unsafe_subst t2 x u)
  | Univ _ -> t
  | Var y -> if x = y then u else t
  | W ((y, t1), t2) ->
      let t1 = unsafe_subst t1 x u in
      let t2 = if x = y then t2 else unsafe_subst t2 x u in
      W ((y, t1), t2)
  | WRec (t1, t2, t3) ->
      WRec (unsafe_subst t1 x u, unsafe_subst t2 x u, unsafe_subst t3 x u)

let free_vars t =
  let rec aux t env acc =
    match t with
    | App (t1, t2) -> acc |> aux t1 env |> aux t2 env
    | Lam ((x, t1), t2) -> acc |> aux t1 env |> aux t2 (x :: env)
    | Pi ((x, t1), t2) -> acc |> aux t1 env |> aux t2 (x :: env)
    | Sup (t1, t2) -> acc |> aux t1 env |> aux t2 env
    | Univ _ -> acc
    | Var x -> if List.mem x env then acc else x :: acc
    | W ((x, t1), t2) -> acc |> aux t1 env |> aux t2 (x :: env)
    | WRec (t1, t2, t3) -> acc |> aux t1 env |> aux t2 env |> aux t3 env
  in
  aux t [] []

let rec free_var t x =
  match t with
  | App (t1, t2) -> free_var t1 x || free_var t2 x
  | Lam ((y, t1), t2) -> free_var t1 x || (x <> y && free_var t2 x)
  | Pi ((y, t1), t2) -> free_var t1 x || (x <> y && free_var t2 x)
  | Sup (t1, t2) -> free_var t1 x || free_var t2 x
  | Univ _ -> false
  | Var y -> x = y
  | W ((y, t1), t2) -> free_var t1 x || (x <> y && free_var t2 x)
  | WRec (t1, t2, t3) -> free_var t1 x || free_var t2 x || free_var t3 x

let find_new_name x taken =
  let rec aux i =
    let x' = Printf.sprintf "%s%d" x i in
    if List.mem x' taken then aux (i + 1) else x'
  in
  if List.mem x taken then aux 0 else x

let rename t taken =
  let rec aux t map =
    match t with
    | App (t1, t2) -> App (aux t1 map, aux t2 map)
    | Lam ((x, t1), t2) ->
        let x' = find_new_name x taken in
        Lam ((x', aux t1 map), aux t2 ((x, x') :: map))
    | Pi ((x, t1), t2) ->
        let x' = find_new_name x taken in
        Pi ((x', aux t1 map), aux t2 ((x, x') :: map))
    | Sup (t1, t2) -> Sup (aux t1 map, aux t2 map)
    | Univ _ -> t
    | Var x ->
        let x = Option.value ~default:x (List.assoc_opt x map) in
        Var x
    | W ((x, t1), t2) ->
        let x' = find_new_name x taken in
        W ((x', aux t1 map), aux t2 ((x, x') :: map))
    | WRec (t1, t2, t3) -> WRec (aux t1 map, aux t2 map, aux t3 map)
  in
  aux t []

let subst t x u =
  let taken = free_vars u in
  let t' = rename t taken in
  unsafe_subst t' x u

let rec subst_many t defs =
  match defs with [] -> t | (x, u) :: defs' -> subst_many (subst t x u) defs'

let rec alpha_eq t t' map =
  match (t, t') with
  | App (t1, t2), App (t1', t2') -> alpha_eq t1 t1' map && alpha_eq t2 t2' map
  | Lam ((x, t1), t2), Lam ((x', t1'), t2') ->
      alpha_eq t1 t1' map && alpha_eq t2 t2' ((x, x') :: map)
  | Pi ((x, t1), t2), Pi ((x', t1'), t2') ->
      alpha_eq t1 t1' map && alpha_eq t2 t2' ((x, x') :: map)
  | Sup (t1, t2), Sup (t1', t2') -> alpha_eq t1 t1' map && alpha_eq t2 t2' map
  | Univ n, Univ n' -> n = n'
  | Var x, Var x' ->
      let x = Option.value ~default:x (List.assoc_opt x map) in
      x = x'
  | W ((x, t1), t2), W ((x', t1'), t2') ->
      alpha_eq t1 t1' map && alpha_eq t2 t2' ((x, x') :: map)
  | WRec (t1, t2, t3), WRec (t1', t2', t3') ->
      alpha_eq t1 t1' map && alpha_eq t2 t2' map && alpha_eq t3 t3' map
  | _ -> false

let rec sub_ty t u map =
  match (t, u) with
  | Pi ((x, t1), t2), Pi ((x', t1'), t2') ->
      sub_ty t1' t1 map && sub_ty t2 t2' ((x, x') :: map)
  | Univ n, Univ m -> n <= m
  | _ -> alpha_eq t u map

let rec normal_form t =
  match t with
  | App (t1, t2) -> (
      let t1' = normal_form t1 in
      let t2' = normal_form t2 in
      match t1' with
      | Lam ((x, _t3), t4) -> normal_form (subst t4 x t2')
      | _ -> App (t1', t2'))
  | Lam ((x, t1), t2) -> Lam ((x, normal_form t1), normal_form t2)
  | Pi ((x, t1), t2) -> Pi ((x, normal_form t1), normal_form t2)
  | Sup (t1, t2) -> Sup (normal_form t1, normal_form t2)
  | Univ _ -> t
  | Var _ -> t
  | W ((x, t1), t2) -> W ((x, normal_form t1), normal_form t2)
  | WRec (t1, t2, t3) -> (
      let t1' = normal_form t1 in
      let t2' = normal_form t2 in
      let t3' = normal_form t3 in
      match t1' with
      | Sup (t4, t5) ->
          normal_form
            (App
               ( App (App (t3', t4), t5),
                 Lam
                   ( ( "_",
                       (* We don't know the type here...
                          TODO: Could this ever be a problem (for instance,
                          could this argument be returned from `t3`)? *)
                       Var "_" ),
                     WRec (App (t5, Var "_"), t2', t3') ) ))
      | _ -> WRec (t1', t2', t3'))

let rec ty t env =
  match t with
  | App (t1, t2) -> (
      match (ty t1 env, ty t2 env) with
      | Some (Pi ((x, t3), t4)), Some t5 when sub_ty t5 t3 [] ->
          Some (normal_form (subst t4 x t2))
      | _ -> None)
  | Lam ((x, t1), t2) -> (
      match ty t2 ((x, t1) :: env) with
      | Some t3 -> Some (Pi ((x, t1), t3))
      | None -> None)
  | Pi ((x, t1), t2) -> (
      match (univ_level t1 env, univ_level t2 ((x, t1) :: env)) with
      | Some t3, Some t4 -> Some (Univ (max t3 t4))
      | _ -> None)
  | Sup (t1, t2) -> (
      match (ty t1 env, ty t2 env) with
      | Some t3, Some (Pi ((x1, t4), t5)) -> (
          match t5 with
          | W ((x2, t6), t7)
            when sub_ty (normal_form (subst t7 x2 (normal_form t1))) t4 []
                 && (not (free_var t5 x1))
                 && sub_ty t3 t6 [] ->
              Some t5
          | _ -> None)
      | _ -> None)
  | Univ n -> Some (Univ (n + 1))
  | Var x -> List.assoc_opt x env
  | W ((x, t1), t2) -> (
      match (univ_level t1 env, univ_level t2 ((x, t1) :: env)) with
      | Some t3, Some t4 -> Some (Univ (max t3 t4))
      | _ -> None)
  | WRec (t1, t2, t3) -> (
      let taken = free_vars t2 in
      let t3' = rename t3 taken in
      match (ty t1 env, ty t2 env, ty t3' env) with
      | ( Some t4,
          Some (Pi ((_, t5), _)),
          Some (Pi ((x1, t6), Pi ((x2, Pi ((x3, t7), t8)), Pi ((_, t9), t10))))
        ) -> (
          match (t4, t9) with
          | W ((x4, t11), t12), Pi ((x5, t13), t14)
            when sub_ty t4 t5 [] && sub_ty t11 t6 []
                 && (not (free_var t8 x3))
                 && sub_ty t7 t12 [ (x4, x1) ]
                 && (not (free_var t8 x1))
                 && sub_ty t4 t8 []
                 && (not (free_var t13 x2))
                 && sub_ty t13 t12 [ (x4, x1) ]
                 && sub_ty (normal_form (App (t2, App (Var x2, Var x5)))) t14 []
                 && sub_ty t10 (normal_form (App (t2, Sup (Var x1, Var x2)))) []
            ->
              Some (normal_form (App (t2, t1)))
          | _ -> None)
      | _ -> None)

and univ_level t env = match ty t env with Some (Univ n) -> Some n | _ -> None

let string_of_term t =
  let rec aux t ~paren_around_app ~paren_around_arrow ~paren_around_lam =
    match t with
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
    | Sup (t1, t2) ->
        let s1 =
          aux t1 ~paren_around_app:false ~paren_around_arrow:false
            ~paren_around_lam:false
        in
        let s2 =
          aux t2 ~paren_around_app:false ~paren_around_arrow:false
            ~paren_around_lam:false
        in
        Printf.sprintf "sup(%s, %s)" s1 s2
    | Univ n -> Printf.sprintf "Type@{%d}" n
    | Var x -> x
    | W ((x, t1), t2) ->
        let l, r = if paren_around_lam then ("(", ")") else ("", "") in
        let s1 =
          aux t1 ~paren_around_app:false ~paren_around_arrow:false
            ~paren_around_lam:false
        in
        let s2 =
          aux t2 ~paren_around_app:false ~paren_around_arrow:false
            ~paren_around_lam:false
        in
        Printf.sprintf "%swtype %s : %s, %s%s" l x s1 s2 r
    | WRec (t1, t2, t3) ->
        let s1 =
          aux t1 ~paren_around_app:false ~paren_around_arrow:false
            ~paren_around_lam:false
        in
        let s2 =
          aux t2 ~paren_around_app:false ~paren_around_arrow:false
            ~paren_around_lam:false
        in
        let s3 =
          aux t3 ~paren_around_app:false ~paren_around_arrow:false
            ~paren_around_lam:false
        in
        Printf.sprintf "wrec(%s, %s, %s)" s1 s2 s3
  in
  aux t ~paren_around_app:false ~paren_around_arrow:false
    ~paren_around_lam:false

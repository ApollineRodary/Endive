open Span

type term =
  | Var of string
  | Lam of annotated_binding * term annotated
  | App of term annotated * term annotated
  | Pi of annotated_binding * term annotated
  | Univ of int annotated
  | Match of term annotated * case list

and annotated_binding = string annotated * term annotated
and case = string annotated list * term annotated

let term_fun t1 t2 = Pi ((fresh "_", t1), t2)
let term_not t = term_fun t (fresh (Var "False"))

let rec term_int n =
  if n = 0 then Var "Z" else App (fresh (Var "S"), fresh (term_int (n - 1)))

let rec subst t x u =
  match t.el with
  | Var y when y = x -> fresh u
  | Lam ((y, t1), t2) ->
      let t1' = subst t1 x u in
      let t2' = if y.el = x then t2 else subst t2 x u in
      { el = Lam ((y, t1'), t2'); span = t.span }
  | App (t1, t2) -> { el = App (subst t1 x u, subst t2 x u); span = t.span }
  | Pi ((y, t1), t2) ->
      let t1' = subst t1 x u in
      let t2' = if y.el = x then t2 else subst t2 x u in
      { el = Pi ((y, t1'), t2'); span = t.span }
  | Match (_t, _cases) -> failwith "TODO"
  | _ -> t

let rec subst_many defs t =
  match defs with [] -> t | (x, u) :: defs' -> subst_many defs' (subst t x u)

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
  | Match (_t, _cases), Match (_t', _cases') -> failwith "TODO"
  | _ -> false

let rec sub_ty t u map =
  match (t, u) with
  | Pi ((x, t1), t2), Pi ((x', t1'), t2') ->
      sub_ty t1'.el t1.el map && sub_ty t2.el t2'.el ((x.el, x'.el) :: map)
  | Univ n, Univ m -> n <= m
  | Match (_t, _cases), Match (_t', _cases') -> failwith "TODO"
  | _ -> alpha_eq t u map

let rec normal_form t =
  match t.el with
  | Lam ((x, t1), t2) ->
      { el = Lam ((x, normal_form t1), normal_form t2); span = t.span }
  | App (t1, t2) -> (
      let t1' = normal_form t1 in
      let t2' = normal_form t2 in
      match t1'.el with
      | Lam ((x, _), t3) -> normal_form (subst t3 x.el t2'.el)
      | _ -> { el = App (t1', t2'); span = t.span })
  | Pi ((x, t1), t2) ->
      { el = Pi ((x, normal_form t1), normal_form t2); span = t.span }
  | Match (_t, _cases) -> failwith "TODO"
  | _ -> t

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
    | Match (t, cases) ->
        let s =
          aux t.el ~paren_around_app:false ~paren_around_arrow:false
            ~paren_around_lam:false
        in
        let cases =
          List.map
            (fun (pattern, t) ->
              let pattern = List.map (fun x -> x.el) pattern in
              let pattern = String.concat " " pattern in
              let t =
                aux t.el ~paren_around_app:false ~paren_around_arrow:false
                  ~paren_around_lam:false
              in
              Printf.sprintf "| %s => %s " pattern t)
            cases
        in
        let cases = String.concat "" cases in
        Printf.sprintf "match %s with %send" s cases
  in
  aux t ~paren_around_app:false ~paren_around_arrow:false
    ~paren_around_lam:false

let rec ty t env =
  match t.el with
  | Var x -> (
      match List.assoc_opt x env with
      | Some t1 -> Ok t1
      | None -> Error { el = "Unbound variable " ^ x ^ "."; span = t.span })
  | Lam ((x, t1), t2) -> (
      match ty t2 ((x.el, t1) :: env) with
      | Ok t3 -> Ok (fresh (Pi ((x, t1), t3)))
      | Error e -> Error e)
  | App (t1, t2) -> (
      match (ty t1 env, ty t2 env) with
      | Error e, _ -> Error e
      | _, Error e -> Error e
      | Ok { el = Pi ((x, t3), t4); span = _ }, Ok t5 ->
          let t2' = normal_form t2 in
          let t3' = normal_form t3 in
          let t5' = normal_form t5 in
          if sub_ty t5'.el t3'.el [] then
            Ok (fresh (normal_form (subst t4 x.el t2'.el)).el)
          else
            Error
              {
                el =
                  "This argument has type " ^ string_of_term t5'.el
                  ^ ", but the function expects it to have type "
                  ^ string_of_term t3'.el ^ ".";
                span = t2.span;
              }
      | Ok _, _ ->
          Error
            {
              el = "The left-hand side of an application must be a function.";
              span = t1.span;
            })
  | Pi ((x, t1), t2) -> (
      match (univ_level t1 env, univ_level t2 ((x.el, t1) :: env)) with
      | Ok t3, Ok t4 ->
          if t3.el >= t4.el then Ok (fresh (Univ t3)) else Ok (fresh (Univ t4))
      | Error e, _ -> Error e
      | _, Error e -> Error e)
  | Univ n -> Ok (fresh (Univ (fresh (n.el + 1))))
  | Match (_t, _cases) -> failwith "TODO"

and univ_level t env =
  match ty t env with
  | Ok { el = Univ n; span = _ } -> Ok n
  | Ok _ -> Error { el = "This term is expected to be a type."; span = t.span }
  | Error e -> Error e

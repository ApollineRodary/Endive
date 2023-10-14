type term =
  | Var of string
  | Lam of binding * term
  | App of term * term
  | Pi of binding * term
  | Univ of int

and binding = string * term

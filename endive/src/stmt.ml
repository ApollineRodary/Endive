open Span
open Term

type stmt =
  | Lemma of annotated_binding * stmt list
  | Let of annotated_binding
  | Def of string annotated * term annotated
  | Exact of term annotated

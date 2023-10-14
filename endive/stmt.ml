open Span
open Term

type annotated_binding = string * term annotated

type stmt =
  | Lemma of annotated_binding * stmt list
  | Let of annotated_binding
  | Exact of term annotated

open Span
open Term

type stmt =
  | Lemma of annotated_binding * stmt list
  | Let of annotated_binding
  | Exact of term annotated

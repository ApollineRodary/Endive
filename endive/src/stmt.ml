open Span
open Term

type inductive_sig = {
  name : string annotated;
  params : annotated_binding list;
  ty : term annotated;
}

type constructor = string annotated * term annotated

type stmt =
  | Def of string annotated * term annotated
  | Exact of term annotated
  | Inductive of inductive_sig * constructor list
  | Lemma of annotated_binding * stmt list
  | Let of annotated_binding

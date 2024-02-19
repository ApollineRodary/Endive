open Span
open Term
open Sexplib.Std
open Ppx_compare_lib.Builtin

type inductive_sig = {
  name : string annotated;
  params : annotated_binding list;
  ty : term annotated;
}
[@@deriving compare, sexp]

type stmt =
  | Def of string annotated * term annotated
  | Exact of term annotated
  | Inductive of inductive_sig * annotated_binding list
  | Lemma of annotated_binding * stmt list
  | Let of annotated_binding
[@@deriving compare, sexp]

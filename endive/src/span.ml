open Sexplib.Std
open Ppx_compare_lib.Builtin

type pos = { line : int; column : int } [@@deriving compare, sexp]
type span = { start : pos; end_ : pos } [@@deriving compare, sexp]
type 'a annotated = { el : 'a; span : span option } [@@deriving compare, sexp]

let fresh el = { el; span = None }
let map f { el; span } = { el = f el; span }

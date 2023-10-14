%{
open Term
open Stmt
open Span

exception UseDiscard

(* The "_" identifier is special and means that the binding will not be used.
   This function is used to validate variable usages.  *)
let validate_var = function
  | "_" -> raise UseDiscard
  | x -> x

let conv_pos (pos : Lexing.position) =
  { line = pos.pos_lnum - 1; column = pos.pos_cnum - pos.pos_bol }

let annotate (start, end_) el =
  let span = Some { start = conv_pos start; end_ = conv_pos end_ } in
  { el; span }
%}

%token ARROW AT COLON COMMA DOT EXACT FORALL FUN IMP LBRACE LEMMA LET LPAREN NOT QED RBRACE RPAREN TYPE
%token <string> ID
%token <int> INT
%token EOF

%nonassoc ARROW COMMA
%right IMP

%start file
%type <stmt list> file

%%

file:
  stmts EOF { List.rev $1 }
;

stmts:
|            { [] }
| stmts stmt { $2 :: $1 }
;

stmt:
  LET annotated_binding DOT                 { Let $2 }
| LEMMA annotated_binding DOT stmts QED DOT { Lemma ($2, List.rev $4) }
| EXACT annotated_term DOT                  { Exact $2 }
;

annotated_binding:
  ID COLON annotated_term               { ($1, $3) }
| LPAREN ID COLON annotated_term RPAREN { ($2, $4) }
;

arg:
  ID                        { Var (validate_var $1) }
| TYPE AT LBRACE INT RBRACE { Univ $4 }
| NOT arg                   { Pi (("_", $2), Var "False") }
| LPAREN term RPAREN        { $2 }
;

app:
  arg     { $1 }
| app arg { App ($1, $2) }
;

term:
  app                       { $1 }
| term IMP term             { Pi (("_", $1), $3) }
| FUN binding ARROW term    { Lam ($2, $4) }
| FORALL binding COMMA term { Pi ($2, $4) }
;

binding:
  ID COLON term               { ($1, $3) }
| LPAREN ID COLON term RPAREN { ($2, $4) }
;

annotated_term:
  term { annotate $sloc $1 }
;
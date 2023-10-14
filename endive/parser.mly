%{
open Term
open Stmt

exception UseDiscard

(* The "_" identifier is special and means that the binding will not be used.
   This function is used to validate variable usages.  *)
let validate_var = function
  | "_" -> raise UseDiscard
  | x -> x
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
  stmt       { [$1] }
| stmts stmt { $2 :: $1 }
;

stmt:
  LET binding DOT                 { Let $2 }
| LEMMA binding DOT stmts QED DOT { Lemma ($2, $4) }
| EXACT term DOT                  { Exact $2 }
;

binding:
  ID COLON term               { ($1, $3) }
| LPAREN ID COLON term RPAREN { ($2, $4) }
;

arg:
  ID                        { Var (validate_var $1) }
| TYPE AT LBRACE INT RBRACE { Univ $4 }
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
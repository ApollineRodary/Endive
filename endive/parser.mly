%{
open Term
open Stmt
%}

%token ARROW AT COLON COMMA DOT EXACT FORALL FUN LBRACE LEMMA LET LPAREN QED RBRACE RPAREN TYPE
%token <string> ID
%token <int> INT
%token EOF

%start file
%type <stmt list> file

%%

file:
  stmts EOF { $1 }
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
  ID                        { Var $1 }
| FUN binding ARROW arg     { Lam ($2, $4) }
| FORALL binding COMMA arg  { Pi ($2, $4) }
| TYPE AT LBRACE INT RBRACE { Univ $4 }
| LPAREN arg RPAREN         { $2 }
;

term:
  arg      { $1 }
| term arg { App ($1, $2) }
;
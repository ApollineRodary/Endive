%{
open Term
%}

%token ARROW AT COLON COMMA FORALL FUN LBRACE LPAREN RBRACE RPAREN TYPE
%token <string> ID
%token <int> INT
%token EOF

%start term
%type <unit> term

%%

term:
  term_ EOF {}
;

arg:
  ID                            { Var $1 }
| FUN ID COLON arg ARROW arg    { Lam (($2, $4), $6) }
| FORALL ID COLON arg COMMA arg { Pi (($2, $4), $6) }
| TYPE AT LBRACE INT RBRACE     { Univ $4 }
| LPAREN arg RPAREN             { $2 }
;

term_:
  arg       { $1 }
| term_ arg { App ($1, $2) }
;
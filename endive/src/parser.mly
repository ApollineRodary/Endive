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

%token ARROW AT CASE COLON COMMA DEF DOT EQ EXACT FORALL FUN IMP LBRACE LEFT LEMMA LET LPAREN NOT QED RBRACE RIGHT RPAREN TYPE VEL WSUP WTYPE WREC
%token <string> ID
%token <int> INT
%token EOF

%nonassoc ARROW COMMA
%right IMP
%right VEL

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
| DEF ID EQ annotated_term DOT              { Def ($2, $4) }
| LEMMA annotated_binding DOT stmts QED DOT { Lemma ($2, List.rev $4) }
| EXACT annotated_term DOT                  { Exact $2 }
;

annotated_binding:
  ID COLON annotated_term               { ($1, $3) }
| LPAREN ID COLON annotated_term RPAREN { ($2, $4) }
;

arg:
  ID                                                       { Var (validate_var $1) }
| INT                                                      { term_int $1 }
| TYPE AT LBRACE INT RBRACE                                { Univ $4 }
| NOT arg                                                  { term_not $2 }
| CASE LPAREN term COMMA term COMMA term COMMA term RPAREN { Case ($3, $5, $7, $9) }
| LEFT LPAREN term COMMA term RPAREN                       { Left ($3, $5) }
| RIGHT LPAREN term COMMA term RPAREN                      { Right ($3, $5) }
| WREC LPAREN term COMMA term COMMA term RPAREN            { WRec ($3, $5, $7) }
| WSUP LPAREN term COMMA term RPAREN                       { Sup ($3, $5) }
| LPAREN term RPAREN                                       { $2 }
;

app:
  arg     { $1 }
| app arg { App ($1, $2) }
;

term:
  app                       { $1 }
| term IMP term             { term_fun $1 $3 }
| term VEL term             { Sum ($1, $3) }
| FUN binding ARROW term    { Lam ($2, $4) }
| FORALL binding COMMA term { Pi ($2, $4) }
| WTYPE binding COMMA term  { W ($2, $4) }
;

binding:
  ID COLON term               { ($1, $3) }
| LPAREN ID COLON term RPAREN { ($2, $4) }
;

annotated_term:
  term { annotate $sloc $1 }
;

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

%token ARROW AT COLON COLONEQ COMMA DEF DOT EXACT FORALL FUN IMP INDUCTIVE LBRACE LEMMA LET LPAREN NOT PROP QED RBRACE PIPE RPAREN SET TYPE
%token <string> ID
%token <int> INT
%token EOF

%nonassoc ARROW COMMA
%right IMP

%start file
%type <stmt list> file

%%

file:
  unfinished_stmts EOF { List.rev $1 }
;

unfinished_stmts:
  stmts                                    { $1 }
| stmts LEMMA binding DOT unfinished_stmts { Lemma($3, List.rev $5) :: $1 }
;

stmts:
|            { [] }
| stmts stmt { $2 :: $1 }
;

stmt:
  DEF id COLONEQ term DOT                          { Def ($2, $4) }
| EXACT term DOT                                   { Exact $2 }
| INDUCTIVE inductive_sig COLONEQ constructors DOT { Inductive ($2, List.rev $4) }
| LEMMA binding DOT stmts QED DOT                  { Lemma ($2, List.rev $4) }
| LET binding DOT                                  { Let $2 }
;

term:
  FORALL LPAREN binding RPAREN COMMA term { annotate $sloc (Pi ($3, $6)) }
| FORALL binding COMMA term               { annotate $sloc (Pi ($2, $4)) }
| FUN LPAREN binding RPAREN ARROW term    { annotate $sloc (Lam ($3, $6)) }
| FUN binding ARROW term                  { annotate $sloc (Lam ($2, $4)) }
| app                                     { $1 }
| term IMP term                           { annotate $sloc (term_fun $1 $3) }
;

app:
  arg     { $1 }
| app arg { annotate $sloc (App ($1, $2)) }
;

arg:
  ID                        { annotate $sloc (Var (validate_var $1)) }
| INT                       { annotate $sloc (term_int $1) }
| SET                       { annotate $sloc (Univ (fresh 0)) }
| TYPE AT LBRACE int RBRACE { annotate $sloc (Univ $4) }
| PROP                      { annotate $sloc (Univ (fresh 1)) }
| NOT arg                   { annotate $sloc (term_not $2) }
| LPAREN term RPAREN        { $2 }
;

int:
  INT { annotate $sloc $1 }
;

id:
  ID { annotate $sloc $1 }
;

binding:
  id COLON term { ($1, $3) }
;

inductive_sig:
  id inductive_params COLON term { { name = $1; params = List.rev $2; ty = $4 } }
;

inductive_params:
                                         { []}
| inductive_params LPAREN binding RPAREN { $3 :: $1 }
;

constructors:
| binding                   { [$1] }
| constructors PIPE binding { $3 :: $1 }
;

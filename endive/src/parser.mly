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

%token ARROW AT COLON COMMA DEF DOT EQ EXACT FORALL FUN IMP LBRACE LEMMA LET LPAREN NOT PROP QED RBRACE RPAREN SET TYPE COMMENT
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
| stmts COMMENT { $1 }
;


stmt:
  LET binding DOT                 { Let $2 }
| DEF annotated_id EQ term DOT    { Def ($2, $4) }
| LEMMA binding DOT stmts QED DOT { Lemma ($2, List.rev $4) }
| EXACT term DOT                  { Exact $2 }
;

binding_:
  annotated_id COLON term { ($1, $3) }
;

binding:
  binding_               { $1 }
| LPAREN binding_ RPAREN { $2 }
;

annotated_id:
  ID { annotate $sloc $1 }
;

arg:
  ID                                  { annotate $sloc (Var (validate_var $1)) }
| INT                                 { annotate $sloc (term_int $1) }
| SET                                 { annotate $sloc (Univ (fresh 0)) }
| TYPE AT LBRACE annotated_int RBRACE { annotate $sloc (Univ $4) }
| PROP                                { annotate $sloc (Univ (fresh 1)) }
| NOT arg                             { annotate $sloc (term_not $2) }
| LPAREN term RPAREN                  { $2 }
;

annotated_int:
  INT { annotate $sloc $1 }
;

app:
  arg     { $1 }
| app arg { annotate $sloc (App ($1, $2)) }
;

term:
  app                       { $1 }
| term IMP term             { annotate $sloc (term_fun $1 $3) }
| FUN binding ARROW term    { annotate $sloc (Lam ($2, $4)) }
| FORALL binding COMMA term { annotate $sloc (Pi ($2, $4)) }
;

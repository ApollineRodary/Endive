{
open Parser
}

rule token = parse
  | '\n'      { Lexing.new_line lexbuf; token lexbuf }
  | [' ''\t'] { token lexbuf }
  | "//"      { comment lexbuf }

  | "=>"        { ARROW }
  | '@'         { AT }
  | ':'         { COLON }
  | ":="        { COLONEQ }
  | ','         { COMMA }
  | '.'         { DOT }
  | "def"       { DEF }
  | "exact"     { EXACT }
  | "forall"    { FORALL }
  | "fun"       { FUN }
  | "->"        { IMP }
  | "Inductive" { INDUCTIVE }
  | '{'         { LBRACE }
  | "Lemma"     { LEMMA }
  | "let"       { LET }
  | '('         { LPAREN }
  | '~'         { NOT }
  | "Prop"      { PROP }
  | "Qed"       { QED }
  | '}'         { RBRACE }
  | ')'         { RPAREN }
  | "Set"       { SET }
  | "Type"      { TYPE }

  | ['a'-'z''A'-'Z''_']['a'-'z''A'-'Z''0'-'9''_']* as s { ID s }
  | ['0'-'9']+ as s                                     { INT (int_of_string s) }

  | eof { EOF }

and comment = parse
  | '\n' { Lexing.new_line lexbuf; token lexbuf }
  | _    { comment lexbuf }
  | eof  { EOF }

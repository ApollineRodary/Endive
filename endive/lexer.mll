{
open Parser
}

rule token = parse
  | [' ''\t''\n'] { token lexbuf }

  | "=>"     { ARROW }
  | '@'      { AT }
  | ':'      { COLON }
  | ','      { COMMA }
  | '.'      { DOT }
  | "exact"  { EXACT }
  | "forall" { FORALL }
  | "fun"    { FUN }
  | '{'      { LBRACE }
  | "Lemma"  { LEMMA }
  | "let"    { LET }
  | '('      { LPAREN }
  | "Qed"    { QED }
  | '}'      { RBRACE }
  | ')'      { RPAREN }
  | "Type"   { TYPE }

  | ['a'-'z''A'-'Z']['a'-'z''A'-'Z''0'-'9']* as s { ID s }
  | ['0'-'9']+ as s                               { INT (int_of_string s) }

  | eof { EOF }

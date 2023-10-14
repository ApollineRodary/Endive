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
  | "->"     { IMP }
  | '{'      { LBRACE }
  | "Lemma"  { LEMMA }
  | "let"    { LET }
  | '('      { LPAREN }
  | '~'      { NOT }
  | "Qed"    { QED }
  | '}'      { RBRACE }
  | ')'      { RPAREN }
  | "Type"   { TYPE }

  | ['a'-'z''A'-'Z''_']['a'-'z''A'-'Z''0'-'9''_']* as s { ID s }
  | ['0'-'9']+ as s                                     { INT (int_of_string s) }

  | eof { EOF }

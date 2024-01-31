{
open Parser
}

rule token = parse
  | '\n' { Lexing.new_line lexbuf; token lexbuf }

  | [' ''\t'] { token lexbuf }

  | "=>"     { ARROW }
  | '@'      { AT }
  | ':'      { COLON }
  | ','      { COMMA }
  | '.'      { DOT }
  | "def"    { DEF }
  | '='      { EQ }
  | "exact"  { EXACT }
  | "forall" { FORALL }
  | "fun"    { FUN }
  | "->"     { IMP }
  | '{'      { LBRACE }
  | "Lemma"  { LEMMA }
  | "let"    { LET }
  | '('      { LPAREN }
  | '~'      { NOT }
  | "Prop"   { PROP }
  | "Qed"    { QED }
  | '}'      { RBRACE }
  | ')'      { RPAREN }
  | "Set"    { SET }
  | "Type"   { TYPE }
  | "/" [^ '\n' ]*      { COMMENT }

  | ['a'-'z''A'-'Z''_']['a'-'z''A'-'Z''0'-'9''_']* as s { ID s }
  | ['0'-'9']+ as s                                     { INT (int_of_string s) }

  | eof { EOF }

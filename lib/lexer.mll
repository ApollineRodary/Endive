{
open Parser
}

rule token = parse
  | [' ''\t''\n'] { token lexbuf }

  | "=>"     { ARROW }
  | ':'      { COLON }
  | ','      { COMMA }
  | "forall" { FORALL }
  | "fun"    { FUN }
  | '('      { LPAREN }
  | ')'      { RPAREN }

  | ['a'-'z''A'-'Z''0'-'9']+ as s { ID s }

  | eof { EOF }

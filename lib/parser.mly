%token ARROW COLON COMMA FORALL FUN LPAREN RPAREN
%token <string> ID
%token EOF

%start term
%type <unit> term

%%

term:
  EOF {}
;

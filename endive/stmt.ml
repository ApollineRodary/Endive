type stmt =
  | Lemma of Term.binding * stmt list
  | Let of Term.binding
  | Exact of Term.term

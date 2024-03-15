export type Binding = { name: string; type: Term; body: Term };

export type Term =
  | { type: "type"; isProp?: boolean }
  | { type: "variable"; name: string }
  | { type: "application"; f: Term; arg: Term }
  | { type: "abstraction"; binding: Binding }
  | { type: "pi"; binding: Binding; isForall?: boolean };

type ParseResult<T> = { t: T; rest: string } | undefined;

function parseType(s: string): ParseResult<Term> {
  if (s.startsWith("Type"))
    return { t: { type: "type", isProp: false }, rest: s.slice(4) };
  if (s.startsWith("Prop"))
    return { t: { type: "type", isProp: true }, rest: s.slice(4) };
}

function parseIdentifier(s: string): ParseResult<string> {
  const regex = /^\w+/y;
  const match = regex.exec(s);
  if (match === null) return undefined;
  return {
    t: match[0],
    rest: s.slice(regex.lastIndex),
  };
}

function parseVariable(s: string): ParseResult<Term> {
  const result = parseIdentifier(s);
  if (result === undefined) return undefined;
  return { t: { type: "variable", name: result.t }, rest: result.rest };
}

function parseParentheses(s: string): ParseResult<Term> {
  if (!s.startsWith("(")) return undefined;
  const result = parseTermInternal(s.slice(1).trimStart());
  if (result === undefined) return undefined;
  const rest = result.rest.trimStart();
  if (!rest.startsWith(")")) return undefined;
  return { t: result.t, rest: rest.slice(1) };
}

function parseBinding(
  s: string,
  binder: string,
  typeDelimiter: string,
  bodyDelimiter: string,
): ParseResult<Binding> {
  if (!s.startsWith(binder)) return undefined;
  const nameResult = parseIdentifier(s.slice(binder.length).trimStart());
  if (nameResult === undefined) return undefined;
  const nameRest = nameResult.rest.trimStart();
  if (!nameRest.startsWith(typeDelimiter)) return undefined;
  const typeResult = parseTermInternal(
    nameResult.rest.slice(typeDelimiter.length).trimStart(),
  );
  if (typeResult === undefined) return undefined;
  const typeRest = typeResult.rest.trimStart();
  if (!typeRest.startsWith(bodyDelimiter)) return undefined;
  const bodyResult = parseTermInternal(
    typeResult.rest.slice(bodyDelimiter.length).trimStart(),
  );
  if (bodyResult === undefined) return undefined;
  return {
    t: { name: nameResult.t, type: typeResult.t, body: bodyResult.t },
    rest: bodyResult.rest,
  };
}

function parseAbstraction(s: string): ParseResult<Term> {
  const bindingResult = parseBinding(s, "λ", ":", ".");
  if (bindingResult === undefined) return undefined;
  return {
    t: { type: "abstraction", binding: bindingResult.t },
    rest: bindingResult.rest,
  };
}

function parsePi(s: string): ParseResult<Term> {
  const bindingResult =
    parseBinding(s, "", ":", ".") ?? parseBinding(s, "∀", "∈", ":");
  if (bindingResult === undefined) return undefined;
  return {
    t: { type: "pi", binding: bindingResult.t },
    rest: bindingResult.rest,
  };
}

function parseUnaryTerm(s: string): ParseResult<Term> {
  return (
    parseType(s) ??
    parseAbstraction(s) ??
    parsePi(s) ??
    parseVariable(s) ??
    parseParentheses(s)
  );
}

function parseTermInternal(s: string): ParseResult<Term> {
  const result = parseUnaryTerm(s);
  if (result === undefined) return undefined;
  let lhs = result.t;
  s = result.rest;
  while (true) {
    const argResult = parseUnaryTerm(s.trimStart());
    if (argResult === undefined) break;
    lhs = { type: "application", f: lhs, arg: argResult.t };
    s = argResult.rest;
  }
  return { t: lhs, rest: s };
}

export function parseTerm(s: string): Term | undefined {
  const result = parseTermInternal(s);
  if (result === undefined || result.rest.trimStart() !== "") return undefined;
  return result.t;
}

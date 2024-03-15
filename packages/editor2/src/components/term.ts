import { Binding, Term } from "../term";

export function termToElement(term: Term): HTMLSpanElement {
  switch (term.type) {
    case "type": {
      const element = document.createElement("span");
      element.classList.add("term");
      if (term.isProp) {
        element.classList.add("term--prop");
        element.textContent = "Prop";
      } else {
        element.classList.add("term--type");
        element.textContent = "Type";
      }
      return element;
    }
    case "variable": {
      const element = document.createElement("span");
      element.classList.add("term");
      element.classList.add("term--variable");
      element.textContent = term.name;
      return element;
    }
    case "application": {
      const element = document.createElement("span");
      element.classList.add("term");
      element.classList.add("term--application");
      element.appendChild(termToElement(term.f));
      element.appendChild(document.createTextNode(" "));
      element.appendChild(termToElement(term.arg));
      return element;
    }
    case "abstraction":
      return bindingToElement(term.binding, "abstraction", "λ", ":", ".");
    case "pi":
      if (term.isForall)
        return bindingToElement(term.binding, "forall", "∀", "∈", ":");
      else return bindingToElement(term.binding, "pi", "Π", ":", ".");
  }
}

export function bindingToElement(
  binding: Binding,
  type: string,
  binder: string,
  typeDelimiter: string,
  bodyDelimiter: string,
): HTMLSpanElement {
  const element = document.createElement("span");
  element.classList.add("term");
  element.classList.add(`term--${type}`);
  element.appendChild(
    document.createTextNode(`${binder}${binding.name}${typeDelimiter}`),
  );
  element.appendChild(termToElement(binding.type));
  element.appendChild(document.createTextNode(`${bodyDelimiter}`));
  element.appendChild(termToElement(binding.body));
  return element;
}

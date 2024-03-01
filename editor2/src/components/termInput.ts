import { Term, parseTerm } from "../term";
import { termToElement } from "./term";

export class TermInput extends HTMLElement {
  static observedAttributes = ["value"];

  private innerElement: HTMLSpanElement;

  constructor() {
    super();

    const shadowRoot = this.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = `
      :host {
        display: inline-block;

        font-size: 17pt;
        font-family: 'Latin Modern Roman', serif;
        font-style: italic;
      }

      #inner {
        display: inline-block;
        outline: none;
        padding: 0 0.2em;
        width: 100%;
      }
    `;
    shadowRoot.appendChild(style);

    this.innerElement = document.createElement("span");
    this.innerElement.id = "inner";
    this.innerElement.contentEditable = "true";
    this.innerElement.spellcheck = false;
    this.innerElement.addEventListener(
      "blur",
      (_event) => (this.value = this.innerElement.innerText),
    );
    shadowRoot.appendChild(this.innerElement);
  }

  attributeChangedCallback(name, _oldValue, newValue) {
    if (name === "value") this.value = newValue;
  }

  get term(): Term | undefined {
    return parseTerm(this.value);
  }

  set term(value: Term | undefined) {
    this.innerElement.innerHTML = "";
    if (value !== undefined)
      this.innerElement.appendChild(termToElement(value));
  }

  get value(): string {
    return this.innerElement.innerText;
  }

  set value(value: string) {
    const term = parseTerm(value);
    if (term === undefined) {
      this.innerElement.textContent = value;
    } else {
      this.innerElement.innerHTML = "";
      this.innerElement.appendChild(termToElement(term));
    }
  }
}

customElements.define("endive-term-input", TermInput);

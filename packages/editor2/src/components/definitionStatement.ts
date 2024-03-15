import { Term } from "../term";
import { NameInput } from "./nameInput";
import { TermInput } from "./termInput";

export class DefinitionStatement extends HTMLElement {
  private readonly nameInput: NameInput;
  private readonly termInput: TermInput;

  constructor() {
    super();

    const shadowRoot = this.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = `
      :host {
        display: flex;
        justify-content: center;
        font-size: 17pt;
        font-family: 'Latin Modern Roman', serif;
        font-style: italic;
        user-select: none;
      }
    `;
    shadowRoot.appendChild(style);

    this.nameInput = document.createElement("endive-name-input") as NameInput;
    shadowRoot.appendChild(this.nameInput);

    shadowRoot.appendChild(document.createTextNode(" = "));

    this.termInput = document.createElement("endive-term-input") as TermInput;
    shadowRoot.appendChild(this.termInput);
  }

  get name(): string {
    return this.nameInput.value;
  }

  set name(value: string) {
    this.nameInput.value = value;
  }

  get term(): Term | undefined {
    return this.termInput.term;
  }

  set term(value: Term | undefined) {
    this.termInput.term = value;
  }

  get value(): string {
    return this.termInput.value;
  }

  set value(value: string) {
    this.termInput.value = value;
  }
}

customElements.define("endive-definition-statement", DefinitionStatement);

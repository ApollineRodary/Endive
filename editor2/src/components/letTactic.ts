import { Term } from "../term";
import { NameInput } from "./nameInput";
import { TermInput } from "./termInput";

export class LetTactic extends HTMLElement {
  private readonly nameInput: NameInput;
  private readonly typeInput: TermInput;

  constructor() {
    super();

    const shadowRoot = this.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = `
      :host {
        display: flex;
        user-select: none;
      }

      #label, #element-of {
        padding: 0 0.2em;
        font-size: 17pt;
        font-family: 'Latin Modern Roman', serif;
      }

      #label {
        padding-left: 0;
      }
      
      endive-term-input { 
        flex-grow: 1;
      }
    `;
    shadowRoot.appendChild(style);

    const labelElement = document.createElement("span");
    labelElement.id = "label";
    labelElement.textContent = "Let";
    shadowRoot.appendChild(labelElement);

    this.nameInput = document.createElement("endive-name-input") as NameInput;
    shadowRoot.appendChild(this.nameInput);

    const elementOf = document.createElement("span");
    elementOf.id = "element-of";
    elementOf.textContent = "∈";
    shadowRoot.appendChild(elementOf);

    this.typeInput = document.createElement("endive-term-input") as TermInput;
    shadowRoot.appendChild(this.typeInput);
  }

  get name(): string {
    return this.nameInput.value;
  }

  set name(value: string) {
    this.nameInput.value = value;
  }

  get type(): Term | undefined {
    return this.typeInput.term;
  }

  set type(value: Term | undefined) {
    this.typeInput.term = value;
  }

  get value(): string {
    return this.typeInput.value;
  }

  set value(value: string) {
    this.typeInput.value = value;
  }
}

customElements.define("endive-let-tactic", LetTactic);

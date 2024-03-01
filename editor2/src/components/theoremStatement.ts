import { Term } from "../term";
import { NameInput } from "./nameInput";
import { TermInput } from "./termInput";

export class TheoremStatement extends HTMLElement {
  private readonly labelElement: HTMLSpanElement;
  private readonly nameInput: NameInput;
  private readonly termInput: TermInput;

  constructor() {
    super();

    const shadowRoot = this.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = `
      :host {
        display: block;
        user-select: none;
      }

      #signature {
        display: flex;
      }

      #label {
        padding-right: 0.25em;
        font-size: 17pt;
        font-family: 'Latin Modern Roman', serif;
        font-weight: bold;
      }

      endive-name-input {
        flex-grow: 1;
      }
      
      endive-term-input {
        display: block;
        margin: 1em auto;
        text-align: center;
      }
    `;
    shadowRoot.appendChild(style);

    const signature = document.createElement("div");
    signature.id = "signature";

    this.labelElement = document.createElement("span");
    this.labelElement.id = "label";
    this.labelElement.textContent = "Theorem";
    signature.appendChild(this.labelElement);

    this.nameInput = document.createElement("endive-name-input") as NameInput;
    signature.appendChild(this.nameInput);

    shadowRoot.appendChild(signature);

    this.termInput = document.createElement("endive-term-input") as TermInput;
    shadowRoot.appendChild(this.termInput);
  }

  get label(): string {
    return this.labelElement.textContent!;
  }

  set label(value: string) {
    this.labelElement.textContent = value;
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

customElements.define("endive-theorem-statement", TheoremStatement);

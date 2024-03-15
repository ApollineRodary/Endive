import { Term } from "../term";
import { TermInput } from "./termInput";

export class WithTactic extends HTMLElement {
  private readonly termInput: TermInput;

  constructor() {
    super();

    const shadowRoot = this.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = `
      :host {
        display: flex;
        user-select: none;
      }

      #label {
        padding-right: 0.2em;
        font-size: 17pt;
        font-family: 'Latin Modern Roman', serif;
      }
      
      endive-term-input { 
        flex-grow: 1;
      }
    `;
    shadowRoot.appendChild(style);

    const labelElement = document.createElement("span");
    labelElement.id = "label";
    labelElement.textContent = "With";
    shadowRoot.appendChild(labelElement);

    this.termInput = document.createElement("endive-term-input") as TermInput;
    shadowRoot.appendChild(this.termInput);
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

customElements.define("endive-with-tactic", WithTactic);

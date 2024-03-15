export interface Pattern {
  readonly regexp: RegExp;
  readonly callback: (match: RegExpMatchArray) => void;
}

export class NameInput extends HTMLElement {
  private readonly editable: HTMLSpanElement;

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

      span {
        display: inline-block;
        outline: none;
        padding: 0 0.2em;
        width: 100%;
      }
    `;
    shadowRoot.appendChild(style);

    this.editable = document.createElement("span");
    this.editable.contentEditable = "true";
    this.editable.spellcheck = false;
    shadowRoot.appendChild(this.editable);
  }

  get value(): string {
    return this.editable.innerText;
  }

  set value(value: string) {
    this.editable.innerText = value;
  }
}

customElements.define("endive-name-input", NameInput);

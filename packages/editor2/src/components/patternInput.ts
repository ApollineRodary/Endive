export interface Pattern {
  readonly regexp: RegExp;
  readonly callback: (match: RegExpMatchArray) => void;
}

export class PatternInput extends HTMLElement {
  patterns: Pattern[] = [];

  constructor() {
    super();

    const shadowRoot = this.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = `
      :host {
        display: inline-block;

        font-size: 17pt;
        font-family: 'Latin Modern Roman', serif;
      }

      span {
        display: inline-block;
        outline: none;
        padding: 0 0.2em;
        width: 100%;
      }
    `;
    shadowRoot.appendChild(style);

    const editable = document.createElement("span");
    editable.contentEditable = "true";
    editable.spellcheck = false;
    editable.addEventListener("input", this.onInput.bind(this));
    shadowRoot.appendChild(editable);
  }

  private onInput(event: Event) {
    const value = (event.target as HTMLSpanElement).innerText;
    for (const pattern of this.patterns) {
      const match = value.match(pattern.regexp);
      if (match !== null) {
        pattern.callback(match);
        return;
      }
    }
  }
}

customElements.define("endive-pattern-input", PatternInput);

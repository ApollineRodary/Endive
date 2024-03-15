export class Button extends HTMLElement {
  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = `
      :host {
        display: inline-block;
        padding: 0.3em 0.5em;
        border: 1px solid rgba(0, 0, 0, 0.5);
        font-family: system-ui;
        user-select: none;
        transition: background-color 0.1s;
      }

      :host(:hover) {
        background-color: rgba(0, 0, 0, 0.1);
      }
    `;
    shadowRoot.appendChild(style);

    shadowRoot.appendChild(document.createElement("slot"));
  }
}

customElements.define("endive-button", Button);

export class StatementSeparator extends HTMLElement {
  constructor() {
    super();

    const shadowRoot = this.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = `
      :host {
        display: flex;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.2s;
      }

      :host(:hover) {
        opacity: 1;
      }
    `;
    shadowRoot.appendChild(style);

    const insertButton = document.createElement("endive-button");
    insertButton.textContent = "＋ Statement";
    insertButton.addEventListener("click", (_event: MouseEvent) => {
      this.dispatchEvent(new CustomEvent("insert"));
    });
    shadowRoot.appendChild(insertButton);
  }
}

customElements.define("endive-statement-separator", StatementSeparator);

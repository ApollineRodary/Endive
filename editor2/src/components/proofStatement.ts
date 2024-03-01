export class ProofStatement extends HTMLElement {
  constructor() {
    super();

    const shadowRoot = this.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = `
      :host {
        display: flex;
        flex-direction: column;
      }

      #tactics {
        display: flex;
        flex-direction: column;
      }

      #tombstone {
        user-select: none;
        align-self: end;
      }
    `;
    shadowRoot.appendChild(style);

    const tombstone = document.createElement("span");
    tombstone.id = "tombstone";
    tombstone.textContent = "□";
    shadowRoot.appendChild(tombstone);
  }
}

customElements.define("endive-proof-statement", ProofStatement);

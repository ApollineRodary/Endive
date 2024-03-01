export class View extends HTMLElement {
  private _shadowRoot: ShadowRoot;

  constructor() {
    super();

    this._shadowRoot = this.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = `
      :host {
        display: block;
        box-sizing: border-box;
        padding: 1em;
      }
    `;
    this._shadowRoot.appendChild(style);

    const statementSeparator = this.createStatementSeparator();
    this._shadowRoot.appendChild(statementSeparator);

    this.insertStatement(
      statementSeparator,
      document.createElement("endive-empty-statement"),
    );
  }

  private insertStatement(nextElement: Element | null, statement: Element) {
    const separator = this.createStatementSeparator();
    this._shadowRoot.insertBefore(statement, nextElement);
    this._shadowRoot.insertBefore(separator, statement);
  }

  private createStatementSeparator() {
    const separator = document.createElement("endive-statement-separator");
    separator.addEventListener("insert", () => {
      this.insertStatement(separator, document.createElement("endive-empty-statement"));
    });
    return separator;
  }
}

customElements.define("endive-view", View);

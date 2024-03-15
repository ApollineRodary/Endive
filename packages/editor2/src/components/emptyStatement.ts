import { Pattern, PatternInput } from "./patternInput";
import { DefinitionStatement } from "./definitionStatement";
import { TheoremStatement } from "./theoremStatement";

export class EmptyStatement extends HTMLElement {
  constructor() {
    super();

    const shadowRoot = this.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = `
      :host, endive-pattern-input {
        display: block;
      }
    `;
    shadowRoot.appendChild(style);

    const patternInput = document.createElement(
      "endive-pattern-input",
    ) as PatternInput;
    const patterns: Pattern[] = [
      {
        regexp: /^(.*)=(.*)$/,
        callback: (match) => {
          const statement = document.createElement(
            "endive-definition-statement",
          ) as DefinitionStatement;
          statement.name = match[1].trim();
          statement.value = match[2].trim();
          this.replaceWith(statement);
        },
      },
      {
        regexp: /^\s*proof\s*$/i,
        callback: (_match) => {
          this.replaceWith(document.createElement("endive-proof-statement"));
        },
      },
    ];
    const theoremWords = [
      "theorem",
      "lemma",
      "corollary",
      "proposition",
      "conjecture",
      "fact",
      "claim",
      "observation",
    ];
    for (const word of theoremWords) {
      patterns.push({
        regexp: new RegExp(
          `^\\s*${word}(?:\\s+(\\w+)(?:\\s+(.*))?)?\\s*$`,
          "i",
        ),
        callback: (match) => {
          const statement = document.createElement(
            "endive-theorem-statement",
          ) as TheoremStatement;
          statement.label = capitalize(word);
          statement.name = match[1]?.trim() ?? "";
          statement.value = match[2]?.trim() ?? "";
          this.replaceWith(statement);
        },
      });
    }
    patternInput.patterns = patterns;
    shadowRoot.appendChild(patternInput);
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

customElements.define("endive-empty-statement", EmptyStatement);

import { LetTactic } from "./letTactic";
import { PatternInput } from "./patternInput";
import { SoTactic } from "./soTactic";
import { SupposeTactic } from "./supposeTactic";
import { WithTactic } from "./withTactic";

export class ProofStatement extends HTMLElement {
  private readonly tactics: HTMLDivElement;

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

    this.tactics = document.createElement("div");
    this.tactics.id = "tactics";
    this.appendEmptyTactic();
    shadowRoot.appendChild(this.tactics);

    const tombstone = document.createElement("span");
    tombstone.id = "tombstone";
    tombstone.textContent = "□";
    shadowRoot.appendChild(tombstone);
  }

  private appendEmptyTactic(): void {
    const patternInput = document.createElement(
      "endive-pattern-input",
    ) as PatternInput;
    patternInput.patterns = [
      {
        regexp: /^\s*suppose\s*(?:\s(.*)\s*)?$/i,
        callback: (match) => {
          const tactic = document.createElement(
            "endive-suppose-tactic",
          ) as SupposeTactic;
          tactic.value = match[1] ?? "";
          patternInput.replaceWith(tactic);
          this.appendEmptyTactic();
        },
      },
      {
        regexp: /^\s*with\s*(?:\s(.*)\s*)?$/i,
        callback: (match) => {
          const tactic = document.createElement(
            "endive-with-tactic",
          ) as WithTactic;
          tactic.value = match[1] ?? "";
          patternInput.replaceWith(tactic);
          this.appendEmptyTactic();
        },
      },
      {
        regexp: /^\s*so\s*(?:\s(.*)\s*)?$/i,
        callback: (match) => {
          const tactic = document.createElement(
            "endive-so-tactic",
          ) as SoTactic;
          tactic.value = match[1] ?? "";
          patternInput.replaceWith(tactic);
          this.appendEmptyTactic();
        },
      },
      {
        regexp: /^\s*let(?:\s+(\w+)(?:\s+(.*))?)?$/i,
        callback: (match) => {
          const tactic = document.createElement(
            "endive-let-tactic",
          ) as LetTactic;
          tactic.name = match[1] ?? "";
          tactic.value = match[2] ?? "";
          patternInput.replaceWith(tactic);
          this.appendEmptyTactic();
        },
      },
    ];
    this.tactics.appendChild(patternInput);
  }
}

customElements.define("endive-proof-statement", ProofStatement);

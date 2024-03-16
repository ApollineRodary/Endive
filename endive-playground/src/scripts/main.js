import { endiveGenerator } from "./generators/endive.js";
import { latexGenerator } from "./generators/latex.js";
import { verifyTheorems } from "./verify.js";

const updateCodeEvents = new Set([
  Blockly.Events.BLOCK_CHANGE,
  Blockly.Events.BLOCK_CREATE,
  Blockly.Events.BLOCK_DELETE,
  Blockly.Events.BLOCK_MOVE,
]);

function updateCode(event) {
  if (workspace.isDragging()) return;
  if (!updateCodeEvents.has(event.type)) return;

  const latexCode = latexGenerator.workspaceToCode(workspace);
  const latexDiv = document.getElementById('latexcodearea')
  latexDiv.innerHTML = latexCode;
  MathJax.typesetPromise([latexDiv]);

  const endiveCode = endiveGenerator.workspaceToCode(workspace);
  document.getElementById("endivecodearea").value = endiveCode;
}

const verifyProofs = function (button) {
  console.log(verifyTheorems(workspace));
};

let toolbox = {
  kind: "categoryToolbox",
  contents: [
    {
      kind: "category",
      name: "Théorèmes",
      contents: [
        {
          kind: "block",
          type: "theorem",
        },
        {
          kind: "block",
          type: "lemma",
        },
      ],
    },
    {
      kind: "category",
      name: "Formules",
      contents: [
        {
          kind: "block",
          type: "proposition_forall",
        },
        {
          kind: "block",
          type: "proposition_exists",
        },
        {
          kind: "block",
          type: "proposition_or",
        },
        {
          kind: "block",
          type: "proposition_and",
        },
        {
          kind: "block",
          type: "proposition_implies",
        },
        {
          kind: "block",
          type: "proposition_reference",
        },
      ],
    },
    {
      kind: "category",
      name: "Preuve",
      contents: [
        {
          kind: "block",
          type: "tactic_let",
        },
        {
          kind: "block",
          type: "tactic_suppose",
        },
        {
          kind: "block",
          type: "tactic_then",
        },
        {
          kind: "button",
          text: "Vérifier",
          callbackKey: "verifyProofs",
        },
      ],
    },
  ],
};

let workspace = Blockly.inject("blocklyDiv", {
  toolbox: toolbox,
  scrollbars: false,
  horizontalLayout: false,
  toolboxPosition: "start",
});

workspace.clear();
workspace.userDefinedTypes = [["Prop"]];
workspace.addChangeListener(updateCode);
workspace.registerButtonCallback("verifyProofs", verifyProofs);

let defaultVariableNames = ["x", "y", "z", "P", "Q"];
defaultVariableNames.forEach(function (variableName) {
  workspace.createVariable(variableName);
});

endiveGenerator.init(workspace);

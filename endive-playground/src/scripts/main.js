import { endiveGenerator } from "./generators/endive.js";
import { latexGenerator } from "./generators/latex.js";
import { verifyTheorems } from "./verify.js";

globalThis.automaticVerif = true;

const updateCodeEvents = new Set([
  Blockly.Events.BLOCK_CHANGE,
  Blockly.Events.BLOCK_CREATE,
  Blockly.Events.BLOCK_DELETE,
  Blockly.Events.BLOCK_MOVE,
]);
export function resize() {
  Blockly.svgResize(workspace);
}

function updateCode(event) {
  if (workspace.isDragging()) return;
  if (!updateCodeEvents.has(event.type)) return;

  const latexCode = latexGenerator.workspaceToCode(workspace);
  const latexDiv = document.getElementById("latexcodearea");
  latexDiv.innerHTML = latexCode;
  MathJax.typesetPromise([latexDiv]);

  if (globalThis.automaticVerif) verifyProofs();

  //const endiveCode = endiveGenerator.workspaceToCode(workspace);
  //document.getElementById("endivecodearea").value = endiveCode;
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
  zoom: {
    controls: true,
    wheel: true,
    startScale: 1.0,
    maxScale: 3,
    minScale: 0.3,
    scaleSpeed: 1.05,
    pinch: true,
  },

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

function togglelatex() {
  var x = document.getElementById("latexcodearea");
  if (x.style.display === "none") {
    x.style.display = "block";
    document.getElementById("blocklyDiv").style.width = "70%";
    document.getElementById("togglelatex").classList.add("pressed");
    resize();
  } else {
    x.style.display = "none";
    document.getElementById("blocklyDiv").style.width = "100%";
    document.getElementById("togglelatex").classList.remove("pressed");
    resize();
  }
}

function toggleautomatic() {
  if (globalThis.automaticVerif) {
    document.getElementById("automatic").classList.remove("pressed");
    document.getElementById("verifyproof").style.display = "block";
  } else {
    document.getElementById("automatic").classList.add("pressed");
    document.getElementById("verifyproof").style.display = "none";
  }
  globalThis.automaticVerif = !globalThis.automaticVerif;
}

document.getElementById("togglelatex").addEventListener("click", togglelatex);
document.getElementById("verifyproof").addEventListener("click", verifyProofs);
document.getElementById("automatic").addEventListener("click", toggleautomatic);

endiveGenerator.init(workspace);
latexGenerator.init(workspace);

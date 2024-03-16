import { endiveGenerator } from "./generators/endive.js";
import { htmlGenerator } from "./generators/html.js";
import { verifyTheorems } from "./verify.js";

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

  const htmlCode = htmlGenerator.workspaceToCode(workspace);
  const mathDisplayDiv = document.getElementById("mathDisplayDiv");
  mathDisplayDiv.innerHTML = htmlCode;
  MathJax.typesetPromise([mathDisplayDiv]);

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

function toggleMathDisplay() {
  var x = document.getElementById("mathDisplayDiv");
  if (x.style.display === "none") {
    x.style.display = "block";
    document.getElementById("blocklyDiv").style.width = "70%";
    document.getElementById("toggleMathDisplay").classList.add("pressed");
    resize();
  } else {
    x.style.display = "none";
    document.getElementById("blocklyDiv").style.width = "100%";
    document.getElementById("toggleMathDisplay").classList.remove("pressed");
    resize();
  }
}

let button = document.getElementById("toggleMathDisplay");
button.addEventListener("click", toggleMathDisplay);

endiveGenerator.init(workspace);

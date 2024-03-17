/*import { endiveGenerator } from "./generators/endive.js";*/
import { latexGenerator } from "./generators/latex.js";
import { htmlGenerator } from "./generators/html.js";
import { validate } from "./verify.js";

globalThis.automaticVerif = true;
globalThis.compileLatex = true;

const updateCodeEvents = new Set([
  Blockly.Events.BLOCK_CHANGE,
  Blockly.Events.BLOCK_CREATE,
  Blockly.Events.BLOCK_DELETE,
  Blockly.Events.BLOCK_MOVE,
]);

export function resize() {
  Blockly.svgResize(workspace);
}

function updateMathDisplay() {
  if (globalThis.compileLatex) {
    const htmlCode = htmlGenerator.workspaceToCode(workspace);
    const mathDisplayDiv = document.getElementById("mathDisplay");
    mathDisplayDiv.innerHTML = htmlCode;
    MathJax.typesetPromise([mathDisplayDiv]);
  } else {
    const latexCode = latexGenerator.workspaceToCode(workspace);
    document.getElementById("mathDisplay").innerHTML = latexCode;
  }
}

function updateCode(event) {
  if (workspace.isDragging()) return;
  if (!updateCodeEvents.has(event.type)) return;

  updateMathDisplay();

  if (globalThis.automaticVerif) verifyProofs();

  //const endiveCode = endiveGenerator.workspaceToCode(workspace);
  //document.getElementById("endivecodearea").value = endiveCode;
}

const verifyProofs = function (button) {
  console.log(validate(workspace));
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
    {
      kind: "category",
      name: "Définitions",
      contents: [
        {
          kind: "block",
          type: "definition_inductive_type",
        },
        {
          kind: "block",
          type: "definition_simple_constructor",
        },
        {
          kind: "block",
          type: "definition_arrow_constructor",
        },
        {
          kind: "block",
          type: "definition_arrow_param",
        },
        {
          kind: "block",
          type: "definition_arrow_end",
        },
        {
          kind: "block",
          type: "definition_unary_predicate",
        },
        {
          kind: "block",
          type: "definition_binary_predicate",
        },
        {
          kind: "block",
          type: "definition_predicate_rule",
        },
        {
          kind: "block",
          type: "definition_predicate_implies",
        },
        {
          kind: "block",
          type: "definition_predicate_forall",
        },
        {
          kind: "block",
          type: "definition_unary_predicate_true",
        },
        {
          kind: "block",
          type: "definition_binary_predicate_true",
        },
      ],
    },
    {
      kind: "category",
      name: "Constructeurs",
      contents: [
        {
          kind: "block",
          type: "constructor_simple",
        },
        {
          kind: "block",
          type: "constructor_simple_final",
        },
        {
          kind: "block",
          type: "constructor_arrow",
        },
        {
          kind: "block",
          type: "constructor_arrow_final",
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

const defaultVariableNames = {
  x: "MathObject",
  y: "MathObject",
  z: "MathObject",
  P: "MathObject",
  Q: "MathObject",
};
for (const [key, value] of Object.entries(defaultVariableNames)) {
  workspace.createVariable(key, value);
}

function toggleMathDisplay() {
  var x = document.getElementById("mathDisplayDiv");
  if (x.style.display === "none") {
    x.style.display = "flex";
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

function toggleautomatic() {
  if (globalThis.automaticVerif) {
    document.getElementById("toggleAutomaticVerif").classList.remove("pressed");
    document.getElementById("verifyProof").style.display = "block";
  } else {
    document.getElementById("toggleAutomaticVerif").classList.add("pressed");
    document.getElementById("verifyProof").style.display = "none";
  }
  globalThis.automaticVerif = !globalThis.automaticVerif;
}

function toggleLatexCompil() {
  if (globalThis.compileLatex) {
    document.getElementById("toggleLatexCompil").classList.remove("pressed");
  } else {
    document.getElementById("toggleLatexCompil").classList.add("pressed");
  }
  globalThis.compileLatex = !globalThis.compileLatex;
  updateMathDisplay();
}

document
  .getElementById("toggleMathDisplay")
  .addEventListener("click", toggleMathDisplay);
document.getElementById("verifyProof").addEventListener("click", verifyProofs);
document
  .getElementById("toggleAutomaticVerif")
  .addEventListener("click", toggleautomatic);

document
  .getElementById("toggleLatexCompil")
  .addEventListener("click", toggleLatexCompil);

/*
endiveGenerator.init(workspace);
latexGenerator.init(workspace);
*/
htmlGenerator.init(workspace);

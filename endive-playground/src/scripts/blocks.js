/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

Blockly.defineBlocksWithJsonArray([
  // Theorems and lemmas
  {
    type: "theorem",
    message0: "Théorème: %1 Preuve: %2 %3",
    args0: [
      {
        type: "input_value",
        name: "STATEMENT",
      },
      {
        type: "input_end_row",
      },
      {
        type: "input_statement",
        name: "PROOF",
      },
    ],
    inputsInline: false,
    colour: 300,
    tooltip: "",
    helpUrl: "",
  },

  {
    type: "lemma",
    message0: "Lemme %1 %2 %3 Preuve: %4 %5",
    args0: [
      {
        type: "field_input",
        name: "NAME",
        text: "whatever",
      },
      {
        type: "input_value",
        name: "STATEMENT",
      },
      {
        type: "input_end_row",
      },
      {
        type: "input_end_row",
      },
      {
        type: "input_statement",
        name: "PROOF",
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: 230,
    tooltip: "",
    helpUrl: "",
  },

  // Statements

  {
    type: "proposition_forall",
    message0: "Pour tout %1 , %2",
    args0: [
      {
        type: "field_variable",
        name: "VARIABLE",
        variable: "%{BKY_VARIABLES_DEFAULT_NAME}",
      },
      {
        type: "input_value",
        name: "PROPOSITION",
      },
    ],
    output: null,
    colour: 65,
    tooltip: "",
    helpUrl: "",
  },

  {
    type: "proposition_exists",
    message0: "Il existe %1 tel que %2",
    args0: [
      {
        type: "field_variable",
        name: "VARIABLE",
        variable: "%{BKY_VARIABLES_DEFAULT_NAME}",
      },
      {
        type: "input_value",
        name: "PROPOSITION",
      },
    ],
    output: null,
    colour: 65,
    tooltip: "",
    helpUrl: "",
  },

  {
    type: "proposition_or",
    message0: "%1 ou %2",
    args0: [
      {
        type: "input_value",
        name: "LEFT",
      },
      {
        type: "input_value",
        name: "RIGHT",
      },
    ],
    inputsInline: true,
    output: null,
    colour: 65,
    tooltip: "",
    helpUrl: "",
  },

  {
    type: "proposition_and",
    message0: "%1 et %2",
    args0: [
      {
        type: "input_value",
        name: "LEFT",
      },
      {
        type: "input_value",
        name: "RIGHT",
      },
    ],
    inputsInline: true,
    output: null,
    colour: 65,
    tooltip: "",
    helpUrl: "",
  },

  {
    type: "proposition_reference",
    message0: "%1",
    args0: [
      {
        type: "field_variable",
        name: "NAME",
        variable: "x",
      },
    ],
    output: null,
    colour: 65,
    tooltip: "",
    helpUrl: "",
  },

  // Tactics
  {
    type: "tactic_let",
    message0: "Soit %1.",
    args0: [
      {
        type: "field_variable",
        name: "VARIABLE",
        variable: "x",
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: 170,
    tooltip: "",
    helpUrl: "",
  },

  {
    type: "tactic_suppose",
    message0: "Supposons %1.",
    args0: [
      {
        type: "input_value",
        name: "HYPOTHESIS",
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: 170,
    tooltip: "",
    helpUrl: "",
  },

  {
    type: "tactic_then",
    message0: "Alors, %1.",
    args0: [
      {
        type: "input_value",
        name: "CONCLUSION",
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: 170,
    tooltip: "",
    helpUrl: "",
  },

  /*
  {
    "type": "proof_destroy_implies",
    "message0": "Supposons %1. Alors,",
    "args0": [
      {
        "type": "input_value",
        "name": "HYPOTHESIS"
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": 170,
    "tooltip": "",
    "helpUrl": ""
  },

  {
    "type": "proof_destroy_and",
    "message0": "Premièrement, %1 %2 De plus, %3 %4",
    "args0": [
      {
        "type": "input_end_row"
      },
      {
        "type": "input_statement",
        "name": "LEFT"
      },
      {
        "type": "input_end_row"
      },
      {
        "type": "input_statement",
        "name": "RIGHT"
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": 170,
    "tooltip": "",
    "helpUrl": ""
  },

  {
    "type": "proof_destroy_or",
    "message0": "En particulier, montrons la proposition de %1.",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "WHICH",
        "options": [
          ["gauche", "LEFT"],
          ["droite", "RIGHT"]
        ]
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": 170,
    "tooltip": "",
    "helpUrl": ""
  },
  
  {
    "type": "proof_axiom",
    "message0": "Par hypothèse, %1",
    "args0": [
      {
        "type": "input_value",
        "name": "STATEMENT"
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": 170,
    "tooltip": "",
    "helpUrl": ""
  }*/
]);

Blockly.Blocks["proposition_implies"] = {
  init: function () {
    this.appendValueInput("ANTECEDENT");
    this.appendValueInput("CONSEQUENT").appendField("⇒");
    this.setOutput(true, null);
    this.setColour(65);
    this.inputsInline = true;
    let thisBlock = this;
    this.svgGroup_.addEventListener("dblclick", function (event) {
      thisBlock.inputsInline = !thisBlock.inputsInline;
      thisBlock.setInputsInline(thisBlock.inputsInline);
      event.stopPropagation();
    });
  },
};

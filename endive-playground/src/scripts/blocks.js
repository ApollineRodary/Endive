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

  // Statements
  {
    type: "proposition_forall",
    message0: "Pour tout %1:%2 , %3",
    args0: [
      {
        type: "field_variable",
        name: "VARIABLE",
        variable: "x",
        variableTypes: ["MathObject"],
        defaultType: "MathObject",
      },
      {
        type: "field_variable",
        name: "TYPE",
        variable: "Prop",
        variableTypes: ["Type"],
        defaultType: "Type",
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
    type: "proposition_reference",
    message0: "%1",
    args0: [
      {
        type: "field_variable",
        name: "NAME",
        variable: "x",
        variableTypes: ["MathObject"],
        defaultType: "MathObject",
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
    message0: "Soit %1 dans %2.",
    args0: [
      {
        type: "field_variable",
        name: "VARIABLE",
        variable: "x",
        variableTypes: ["MathObject"],
        defaultType: "MathObject",
      },
      {
        type: "field_variable",
        name: "TYPE",
        variable: "Prop",
        variableTypes: ["Type"],
        defaultType: "Type",
      },
    ],
    inputsInline: true,
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

  // Definitions
  {
    type: "definition_inductive_type",
    message0: "Type inductif : %1 %2 Constructeurs : %3 %4",
    args0: [
      {
        type: "field_variable",
        name: "NAME",
        variable: "N",
        variableTypes: ["Type"],
        defaultType: "Type",
      },
      {
        type: "input_end_row",
      },
      {
        type: "input_end_row",
      },
      {
        type: "input_statement",
        name: "CONSTRUCTORS",
      },
    ],
    inputsInline: false,
    colour: 30,
    tooltip: "",
    helpUrl: "",
  },

  {
    type: "definition_simple_constructor",
    message0: "%1",
    args0: [
      {
        type: "field_variable",
        name: "NAME",
        variable: "zero",
        variableTypes: ["Constructor"],
        defaultType: "Constructor",
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: 50,
  },

  {
    type: "definition_arrow_constructor",
    message0: "%1: %2",
    args0: [
      {
        type: "field_variable",
        name: "NAME",
        variable: "S",
        variableTypes: ["Constructor"],
        defaultType: "Constructor",
      },
      {
        type: "input_value",
        name: "PARAMETERS",
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: 50,
  },

  {
    type: "definition_arrow_param",
    message0: "%1 → %2",
    args0: [
      {
        type: "field_variable",
        name: "PARAMETER",
        variableTypes: ["Type"],
        defaultType: "Type",
      },
      {
        type: "input_value",
        name: "NEXT",
      },
    ],
    output: null,
    colour: 50,
  },

  {
    type: "definition_arrow_end",
    message0: "this",
    args0: [],
    output: null,
    colour: 50,
  },
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

Blockly.Extensions.register("dynamic_type_dropdown", function () {
  let thisBlock = this;
  this.getInput("TYPE").appendField(
    new Blockly.FieldDropdown(function () {
      return customTypes.map((t) => [t[0], t[0].toUpperCase()]);
    }),
  );
});

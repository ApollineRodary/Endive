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

  {
    type: "definition_unary_predicate",
    message0: "Prédicat : %1 sur %2 %3 Règles : %4 %5",
    args0: [
      {
        type: "field_variable",
        name: "NAME",
        variable: "pair",
        variableTypes: ["Predicate"],
        defaultType: "Predicate",
      },
      {
        type: "field_variable",
        name: "TYPE",
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
        name: "RULES",
      },
    ],
    colour: 0,
  },

  {
    type: "definition_binary_predicate",
    message0: "Prédicat : %1 sur %2 et %3 %4 Règles : %5 %6",
    args0: [
      {
        type: "field_variable",
        name: "NAME",
        variable: "eq",
        variableTypes: ["Predicate"],
        defaultType: "Predicate",
      },
      {
        type: "field_variable",
        name: "TYPE",
        variable: "N",
        variableTypes: ["Type"],
        defaultType: "Type",
      },
      {
        type: "field_variable",
        name: "TYPE",
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
        name: "RULES",
      },
    ],
    colour: 0,
  },

  {
    type: "definition_predicate_rule",
    message0: "Règle %1: %2",
    args0: [
      {
        type: "field_variable",
        name: "NAME",
        variableTypes: ["PredicateRule"],
        defaultType: "PredicateRule",
      },
      {
        type: "input_value",
        name: "PROPOSITION",
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: 18,
  },

  {
    type: "definition_predicate_forall",
    message0: "Pour tout %1:%2, %3",
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
    colour: 18,
    tooltip: "",
    helpUrl: "",
  },

  {
    type: "definition_predicate_implies",
    message0: "Si %1 Alors %2",
    args0: [
      {
        type: "input_value",
        name: "ANTECEDENT",
        align: "RIGHT",
      },
      {
        type: "input_value",
        name: "CONSEQUENT",
        align: "RIGHT",
      },
    ],
    output: null,
    colour: 18,
    tooltip: "",
    helpUrl: "",
  },

  {
    type: "definition_unary_predicate_true",
    message0: "vrai pour %1",
    args0: [
      {
        type: "input_value",
        name: "VALUE",
      },
    ],
    output: null,
    colour: 18,
  },

  {
    type: "definition_binary_predicate_true",
    message0: "vrai pour %1 et %2",
    args0: [
      {
        type: "input_value",
        name: "VALUE",
      },
      {
        type: "input_value",
        name: "VALUE",
      },
    ],
    inputsInline: true,
    output: null,
    colour: 18,
  },

  // Constructors
  {
    type: "constructor_simple",
    message0: "%1, %2",
    args0: [
      {
        type: "field_variable",
        name: "NAME",
        variableTypes: ["Constructor", "MathObject"],
        defaultType: "Constructor",
      },
      {
        type: "input_value",
        name: "NEXT",
      },
    ],
    output: null,
    colour: 25,
  },

  {
    type: "constructor_simple_final",
    message0: "%1",
    args0: [
      {
        type: "field_variable",
        name: "NAME",
        variableTypes: ["Constructor", "MathObject"],
        defaultType: "Constructor",
      },
    ],
    output: null,
    colour: 25,
  },

  {
    type: "constructor_arrow",
    message0: "%1 (%2), %3",
    args0: [
      {
        type: "field_variable",
        name: "NAME",
        variableTypes: ["Constructor"],
        defaultType: "Constructor",
      },
      {
        type: "input_value",
        name: "BODY",
      },
      {
        type: "input_value",
        name: "NEXT",
      },
    ],
    output: null,
    inputsInline: true,
    colour: 25,
  },

  {
    type: "constructor_arrow_final",
    message0: "%1 (%2)",
    args0: [
      {
        type: "field_variable",
        name: "NAME",
        variableTypes: ["Constructor"],
        defaultType: "Constructor",
      },
      {
        type: "input_value",
        name: "BODY",
      },
    ],
    output: null,
    inputsInline: true,
    colour: 25,
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

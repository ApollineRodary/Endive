export const htmlGenerator = new Blockly.Generator("HTML");

htmlGenerator.RESERVED_WORDS_ = "Théorème,Preuve";
htmlGenerator.init = function (workspace) {
  this.nameDB_ = new Blockly.Names(htmlGenerator.RESERVED_WORDS_);
  htmlGenerator.nameDB_.setVariableMap(workspace.getVariableMap());
};

htmlGenerator["theorem"] = function (block, generator) {
  const statement = generator.valueToCode(block, "STATEMENT", 0);

  var proof = "";
  var proofBlock = block.getInput("PROOF").connection.targetBlock();
  while (proofBlock) {
    var tactic = generator.blockToCode(proofBlock).replace(/^/gm, "  ") + "\n";
    proof += tactic;
    proofBlock = proofBlock.getNextBlock();
  }

  const code = `<b>Théorème :</b> $${statement}$ <br/><br/> <i>Preuve :</i> <br/> ${proof} <br/>`;
  return code;
};

htmlGenerator["proposition_forall"] = function (block, generator) {
  const variable = htmlGenerator.getVariableName(
    block.getFieldValue("VARIABLE"),
  );
  const type = htmlGenerator.getVariableName(
    block.getFieldValue("TYPE"),
  );
  const proposition = generator.valueToCode(block, "PROPOSITION", 0);
  return [`\\forall ${variable} \\in ${type}, ${proposition}`, 0];
};

htmlGenerator["proposition_implies"] = function (block, generator) {
  const antecedent = generator.valueToCode(block, "ANTECEDENT", 90);
  const consequent = generator.valueToCode(block, "CONSEQUENT", 99);
  return [`${antecedent} \\implies ${consequent}`, 99];
};

htmlGenerator["proposition_reference"] = function (block, generator) {
  const name = htmlGenerator.getVariableName(block.getFieldValue("NAME"));
  return [name, 0];
};

htmlGenerator["tactic_let"] = function (block, generator) {
  const variable = htmlGenerator.getVariableName(
    block.getFieldValue("VARIABLE"),
  );
  const type = htmlGenerator.getVariableName(
    block.getFieldValue("TYPE"),
  );
  return `Soit $${variable} \\in ${type}$.<br/>`;
};

htmlGenerator["tactic_suppose"] = function (block, generator) {
  const hypothesis = htmlGenerator.valueToCode(block, "HYPOTHESIS", 0);
  return `Supposons $${hypothesis}$.<br/>`;
};

htmlGenerator["tactic_then"] = function (block, generator) {
  const conclusion = htmlGenerator.valueToCode(block, "CONCLUSION", 0);
  return `Alors $${conclusion}$.<br/>`;
};

htmlGenerator["definition_inductive_type"] = function(block, generator) {
  return "";
}

htmlGenerator["definition_simple_constructor"] = function(block, generator) {
  return "";
}

htmlGenerator["definition_arrow_constructor"] = function(block, generator) {
  return "";
}

htmlGenerator["definition_arrow_param"] = function(block, generator) {
  return ["", 0];
}

htmlGenerator["definition_arrow_end"] = function(block, generator) {
  return ["", 0];
}

htmlGenerator["definition_unary_predicate"] = function(block, generator) {
  return "";
}

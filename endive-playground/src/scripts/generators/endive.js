export const endiveGenerator = new Blockly.Generator("Endive");

endiveGenerator.RESERVED_WORDS_ = "lemma,let,so,then,with,suppose";
endiveGenerator.init = function (workspace) {
  this.nameDB_ = new Blockly.Names(endiveGenerator.RESERVED_WORDS_);
  endiveGenerator.nameDB_.setVariableMap(workspace.getVariableMap());
};

endiveGenerator["theorem"] = function (block, generator) {
  const statement = generator.valueToCode(block, "STATEMENT", 0);

  var proof = "";
  var proofBlock = block.getInput("PROOF").connection.targetBlock();

  while (proofBlock) {
    var tactic =
      generator.blockToCode(proofBlock).slice(0, -1).replace(/^/gm, "  ") +
      "\n";
    proof += tactic;
    proofBlock = proofBlock.getNextBlock();
  }

  const code = `Lemma theorem: ${statement}.\n${proof}Qed.`;
  return code;
};

endiveGenerator["proposition_forall"] = function (block, generator) {
  const variable = endiveGenerator.getVariableName(
    block.getFieldValue("VARIABLE"),
  );
  const proposition = generator.valueToCode(block, "PROPOSITION", 0);
  return [`forall ${variable}:Prop, ${proposition}`, 0];
};

endiveGenerator["proposition_implies"] = function (block, generator) {
  const antecedent = generator.valueToCode(block, "ANTECEDENT", 90);
  const consequent = generator.valueToCode(block, "CONSEQUENT", 99);
  return [`${antecedent} -> ${consequent}`, 99];
};

endiveGenerator["proposition_reference"] = function (block, generator) {
  const name = endiveGenerator.getVariableName(block.getFieldValue("NAME"));
  return [name, 0];
};

endiveGenerator["tactic_let"] = function (block, generator) {
  const variable = endiveGenerator.getVariableName(
    block.getFieldValue("VARIABLE"),
  );
  return `let ${variable}: Prop.\n`;
};

endiveGenerator["tactic_suppose"] = function (block, generator) {
  const hypothesis = endiveGenerator.valueToCode(block, "HYPOTHESIS", 0);
  return `suppose ${hypothesis}.\n`;
};

endiveGenerator["tactic_then"] = function (block, generator) {
  const conclusion = endiveGenerator.valueToCode(block, "CONCLUSION", 0);
  return `then ${conclusion}.\n`;
};

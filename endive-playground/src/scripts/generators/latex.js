
export const latexGenerator = new Blockly.Generator("Endive");

latexGenerator.RESERVED_WORDS_ = "let,lemma,example,ohno";
latexGenerator.init = function (workspace) {
  this.nameDB_ = new Blockly.Names(latexGenerator.RESERVED_WORDS_);
  latexGenerator.nameDB_.setVariableMap(workspace.getVariableMap());
};

/*latexGenerator.scrub_ = function (block, code, thisOnly) {
  const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
  if (nextBlock && !thisOnly) {
    return code + latexGenerator.blockToCode(nextBlock);
  }
  return code;
};*/

latexGenerator["theorem"] = function (block, generator) {
  const statement = generator.valueToCode(block, "STATEMENT", 0);

  var proof = "";
  var proofBlock = block.getInput("PROOF").connection.targetBlock();

  while (proofBlock) {
    var tactic =
      generator.blockToCode(proofBlock).replace(/^/gm, "  ") +
      "\n";
    proof += tactic;
    proofBlock = proofBlock.getNextBlock();
  }
  if (statement === "") {
    return ""
  }
  const code = `Théorème : $${statement}$<br/> Proof : <br/>${proof} <br/>`;
  return code;
};

latexGenerator["lemma"] = function (block, generator) {
  const name = block.getFieldValue("NAME");
  const statement = generator.valueToCode(block, "STATEMENT", 0);

  var proof = "";
  var proofBlock = block.getInput("PROOF").connection.targetBlock();

  while (proofBlock) {
    var tactic =
      generator.blockToCode(proofBlock).replace(/^/gm, "  ") +
      "\n";
    alert(tactic);
    proof += tactic;
    proofBlock = proofBlock.getNextBlock();
  }

  if (statement === "") {

  }

  const code = `Lemme ${name} : $${statement}$<br/> Proof : <br/>${proof} <br/>`;
  return code;
};

latexGenerator["proposition_forall"] = function (block, generator) {
  const variable = latexGenerator.getVariableName(
    block.getFieldValue("VARIABLE"),
  );
  const proposition = generator.valueToCode(block, "PROPOSITION", 0);
  return [`\\forall ${variable}, ${proposition}`, 0];
};

latexGenerator["proposition_exists"] = function (block, generator) {
  const variable = latexGenerator.getVariableName(
    block.getFieldValue("VARIABLE"),
  );
  const proposition = generator.valueToCode(block, "PROPOSITION", 0);
  return [`\\exists ${variable}, ${proposition}`, 0];
};

latexGenerator["proposition_or"] = function (block, generator) {
  const left = generator.valueToCode(block, "LEFT", 2);
  const right = generator.valueToCode(block, "RIGHT", 2);
  return [`${left} \\lor ${right}`, 2];
};

latexGenerator["proposition_and"] = function (block, generator) {
  const left = generator.valueToCode(block, "LEFT", 1);
  const right = generator.valueToCode(block, "RIGHT", 1);
  return [`${left} \\land ${right}`, 1];
};

latexGenerator["proposition_implies"] = function (block, generator) {
  const antecedent = generator.valueToCode(block, "ANTECEDENT", 90);
  const consequent = generator.valueToCode(block, "CONSEQUENT", 99);
  return [`${antecedent} \\implies ${consequent}`, 99];
};

latexGenerator["proposition_reference"] = function (block, generator) {
  const name = latexGenerator.getVariableName(block.getFieldValue("NAME"));
  return [name, 0];
};

latexGenerator["tactic_let"] = function (block, generator) {
  const variable = latexGenerator.getVariableName(
    block.getFieldValue("VARIABLE"),
  );
  return `Soit $${variable}$.<br/>`;
};

latexGenerator["tactic_suppose"] = function (block, generator) {
  const hypothesis = latexGenerator.valueToCode(block, "HYPOTHESIS", 0);
  return `Supposons $${hypothesis}$.<br/>`;
};

latexGenerator["tactic_then"] = function (block, generator) {
  const conclusion = latexGenerator.valueToCode(block, "CONCLUSION", 0);
  return `Alors $${conclusion}$.<br/>`;
};

export const latexGenerator = new Blockly.Generator("LaTeX");

latexGenerator.RESERVED_WORDS_ = "";
latexGenerator.init = function (workspace) {
  this.nameDB_ = new Blockly.Names(latexGenerator.RESERVED_WORDS_);
  latexGenerator.nameDB_.setVariableMap(workspace.getVariableMap());
};

latexGenerator["theorem"] = function (block, generator) {
  const statement = "  " + generator.valueToCode(block, "STATEMENT", 0);

  var proof = "";
  var proofBlock = block.getInput("PROOF").connection.targetBlock();
  while (proofBlock) {
    var tactic = generator.blockToCode(proofBlock).replace(/^/gm, "  ") + "\n";
    proof += tactic;
    proofBlock = proofBlock.getNextBlock();
  }

  const code = `\\begin{theorem}\n  ${statement}$\n\\end{theorem}\n\\begin{proof}${proof}\\end{proof}\n`;
  return code;
};

latexGenerator["proposition_forall"] = function (block, generator) {
  const variable = latexGenerator.getVariableName(
    block.getFieldValue("VARIABLE"),
  );
  const proposition = generator.valueToCode(block, "PROPOSITION", 0);
  return [`\\forall ${variable}, ${proposition}`, 0];
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
  if (hypothesis < 50) return `Supposons $${hypothesis}$.`;
  else
    return `Supposons \n\\begin{equation*}\n  ${hypothesis}\n\\end{equation*}\n\n`;
};

latexGenerator["tactic_then"] = function (block, generator) {
  const conclusion = latexGenerator.valueToCode(block, "CONCLUSION", 0);
  if (hypothesis < 50) return `Alors, $${conclusion}$.\n\n`;
  else
    return `Alors, \n\\begin{equation*}\n  ${conclusion}\n\\end{equation*}\n\n`;
};

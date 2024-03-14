import intialize, * as endive from "endive-wasm";
import url from "url:endive-wasm/endive_wasm_bg.wasm";

const _ = require("lodash");

const prop = {
  type: "universe",
  level: {},
};

function makeFreshVariable(environment) {
  let len = environment.length;
  return `h${len}`;
}

function isBound(environment, name) {
  return environment.some((pair) => pair[0] == name);
}

function deBruijnIndex(environment, name) {
  const index = environment.findIndex((pair) => _.isEqual(pair[0], name));
  if (index == -1)
    throw new Error("Asked for index of an unbound variable name");
  return environment.length - index - 1;
}

function offsetIndices(lterm) {
  if (lterm.type == "variable") {
    return {
      type: "variable",
      index: lterm.index + 1,
    };
  }

  if (lterm.type == "abstraction" || lterm.type == "pi") {
    return {
      type: lterm.type,
      variable: offsetIndices(lterm.variable),
      body: offsetIndices(lterm.body),
    };
  }

  return lterm;
}

function convertStatement(block, environment) {
  /** Converts a statement block into the corresponding lambda-term */
  if (block == null) {
    throw new Error("Incomplete statement");
  }

  if (block.type === "proposition_forall") {
    let name = block.getField("VARIABLE").getText();

    let propositionBlock = block
      .getInput("PROPOSITION")
      .connection.targetBlock();
    if (propositionBlock == null) {
      block.setWarningText("Ce quantificateur n'est pas complet.");
      throw new Error("Incomplete statement");
    }

    let proposition = convertStatement(
      propositionBlock,
      environment
        .concat([[name, prop]])
        .map((x) => [x[0], offsetIndices(x[1])]),
    );

    return {
      type: "pi",
      variable: prop,
      body: proposition,
    };
  }

  if (block.type === "proposition_implies") {
    let antecedentBlock = block.getInput("ANTECEDENT").connection.targetBlock();
    let consequentBlock = block.getInput("CONSEQUENT").connection.targetBlock();
    if (antecedentBlock == null || consequentBlock == null) {
      block.setWarningText("Cette implication n'est pas complète.");
      throw new Error("Incomplete statement");
    }

    let antecedent = convertStatement(antecedentBlock, environment);
    let consequent = convertStatement(
      consequentBlock,
      environment
        .concat([[makeFreshVariable(environment), antecedent]])
        .map((x) => [x[0], offsetIndices(x[1])]),
    );

    return {
      type: "pi",
      variable: antecedent,
      body: consequent,
    };
  }

  if (block.type === "proposition_reference") {
    let name = block.getField("NAME").getText();

    if (!isBound(environment, name)) {
      block.setWarningText("Cet élément n'est pas défini.");
      throw new Error(`Unbound variable ${name}`);
    }

    return {
      type: "variable",
      index: deBruijnIndex(environment, name),
    };
  }

  throw new Exception(`Unsupported block type ${block.type}`);
}

function convertTactics(block, environment, hypotheses) {
  /** Converts a proof into the corresponding lambda-term
   * Environment: pairs of variable names and their types (used to compute de Bruijn indexes and to verify that nothing that is used is unbound)
   * Hypotheses: lambda-terms
   */
  if (block == null) {
    return hypotheses[hypotheses.length - 1][0];
  }

  if (block.type === "tactic_let") {
    let name = block.getField("VARIABLE").getText();
    let restOfProof = convertTactics(
      block.nextConnection.targetBlock(),
      environment
        .concat([[name, prop]])
        .map((x) => [x[0], offsetIndices(x[1])]),
      hypotheses.map((x) => [offsetIndices(x[0]), offsetIndices(x[1])]),
    );
    return {
      type: "abstraction",
      variable: prop,
      body: restOfProof,
    };
  }

  if (block.type === "tactic_suppose") {
    let hypothesisBlock = block.getInput("HYPOTHESIS").connection.targetBlock();
    if (hypothesisBlock == null) {
      block.setWarningText(
        "Vous n'avez pas précisé d'énoncé pour cette hypothèse.",
      );
      throw new Error("Missing hypothesis");
    }

    let hypothesis = convertStatement(hypothesisBlock, environment, hypotheses);
    let offsetHypothesis = offsetIndices(hypothesis);
    let hypothesisName = makeFreshVariable(environment);

    let restOfProof = convertTactics(
      block.nextConnection.targetBlock(),
      environment
        .map((x) => [x[0], offsetIndices(x[1])])
        .concat([[hypothesisName, offsetHypothesis]]),
      hypotheses
        .map((x) => [offsetIndices(x[0]), offsetIndices(x[1])])
        .concat([
          [
            {
              type: "variable",
              index: 0,
            },
            offsetHypothesis,
          ],
        ]),
    );
    return {
      type: "abstraction",
      variable: hypothesis,
      body: restOfProof,
    };
  }

  if (block.type === "tactic_then") {
    let conclusionBlock = block.getInput("CONCLUSION").connection.targetBlock();
    if (conclusionBlock == null) {
      block.setWarningText(
        "Vous n'avez pas précisé d'énoncé pour cette conclusion.",
      );
      throw new Error("Missing conclusion");
    }

    let conclusion = convertStatement(conclusionBlock, environment, hypotheses);

    // Look for conclusion in hypotheses
    let lterm = null;
    for (let i = 0; i < hypotheses.length; ++i) {
      //if (endive.betaEquivalent(hypotheses[i][1], conclusion)) {
      if (_.isEqual(hypotheses[i][1], conclusion)) {
        lterm = hypotheses[i][0];
        break;
      }
    }

    // Otherwise, look for a pair of hypotheses (A->B, A) where B is our conclusion
    for (let i = 0; i < hypotheses.length; ++i) {
      if (lterm !== null) break;
      for (let j = 0; j < hypotheses.length; ++j) {
        if (
          _.isEqual(hypotheses[i][1], {
            type: "pi",
            variable: hypotheses[j][1],
            body: offsetIndices(conclusion),
          })
        ) {
          lterm = {
            type: "application",
            f: hypotheses[i][0],
            argument: hypotheses[j][0],
          };
          break;
        }
      }
    }

    if (lterm !== null) {
      return convertTactics(
        block.nextConnection.targetBlock(),
        environment,
        hypotheses.concat([[lterm, conclusion]]),
      );
    }
    block.setWarningText(
      "Vos hypothèses ne permettent pas d'arriver à cette conclusion.",
    );
  }
}

function verifyTheorem(block) {
  /* Reads a theorem block and verifies that it is valid and that the proof is correct */

  // Read statement
  let statementBlock = block.getInput("STATEMENT").connection.targetBlock();
  if (statementBlock == null) {
    block.setWarningText("Vous n'avez pas précisé d'énoncé pour ce théorème.");
    return false;
  }
  let statement = convertStatement(statementBlock, [], []);
  document.getElementById("latexcodearea").value = JSON.stringify(statement);

  console.log("Inferring statement type");
  let statementType = endive.inferType(statement);
  if (statementType.type !== "universe") {
    console.error("Ill-typed statement");
    console.log(statementType);
    return false;
  }

  // Read proof
  let proofBlock = block.getInput("PROOF").connection.targetBlock();
  if (proofBlock == null) {
    block.setWarningText("Vous n'avez pas prouvé ce théorème.");
    return false;
  }
  console.log("Converting proof");
  let proof = convertTactics(proofBlock, [], []);

  document.getElementById("latexcodearea").value =
    `Statement: ${JSON.stringify(statement)}\n\nProof: ${JSON.stringify(proof)}`;

  // Verify beta-equivalence
  console.log("Testing for beta-equivalence");
  let isBetaEquivalent = endive.betaEquivalent(
    endive.inferType(proof),
    statement,
  );
  console.log("Beta equivalence:");
  console.log(statement);
  console.log(endive.inferType(proof));
  console.log(isBetaEquivalent);

  if (!isBetaEquivalent) {
    block.setWarningText("Cette preuve est valide, mais ne prouve pas ce que vous avez énoncé :(");
  }
  else {
    block.setTooltip("Preuve valide :D");
    block.setColour(120);
  }
}

export async function verifyTheorems(workspace) {
  await intialize(url);
  let blocks = workspace.getAllBlocks();

  // Reset warnings for all blocks
  for (let i = 0; i < blocks.length; ++i) blocks[i].setWarningText("");

  // Verify theorems
  for (let i = 0; i < blocks.length; ++i) {
    let block = blocks[i];
    if (block.type !== "theorem") continue;
    verifyTheorem(block);
  }
}

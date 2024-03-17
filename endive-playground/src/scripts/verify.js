import intialize, * as endive from "endive-wasm";
import url from "url:endive-wasm/endive_wasm_bg.wasm";

const _ = require("lodash");

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

function lift(lterm) {
  if (lterm.type == "variable") {
    return {
      type: "variable",
      index: lterm.index + 1,
    };
  }

  if (lterm.type == "abstraction" || lterm.type == "pi") {
    return {
      type: lterm.type,
      variable: lift(lterm.variable),
      body: lift(lterm.body),
    };
  }

  return lterm;
}

function convertStatement(block, environment, types) {
  /** Converts a statement block into the corresponding lambda-term */
  if (block == null) {
    throw new Error("Incomplete statement");
  }

  if (block.type === "proposition_forall") {
    let name = block.getField("VARIABLE").getText();
    let typeName = block.getField("TYPE").getText();
    if (!(typeName in types)) {
      block.setWarningText("Ce type n'est pas défini.");
      throw new Error("Unbound type");
    }
    let type = types[typeName];

    let propositionBlock = block
      .getInput("PROPOSITION")
      .connection.targetBlock();
    if (propositionBlock == null) {
      block.setWarningText("Ce quantificateur n'est pas complet.");
      throw new Error("Incomplete statement");
    }

    let proposition = convertStatement(
      propositionBlock,
      environment.concat([[name, type]]).map((x) => [x[0], lift(x[1])]),
      types,
    );

    return {
      type: "pi",
      variable: type,
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

    let antecedent = convertStatement(antecedentBlock, environment, types);
    let consequent = convertStatement(
      consequentBlock,
      environment
        .concat([[makeFreshVariable(environment), antecedent]])
        .map((x) => [x[0], lift(x[1])]),
      types,
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

function convertTactics(block, environment, hypotheses, types) {
  /** Converts a proof into the corresponding lambda-term
   * Environment: pairs of variable names and their types (used to compute de Bruijn indexes and to verify that nothing that is used is unbound)
   * Hypotheses: lambda-terms
   */

  if (block == null) {
    return hypotheses[hypotheses.length - 1][0];
  }

  if (block.type === "tactic_let") {
    let name = block.getField("VARIABLE").getText();
    let typeName = block.getField("TYPE").getText();
    if (!(typeName in types)) {
      block.setWarningText("Ce type n'est pas défini.");
      throw new Error("Unbound type");
    }
    let type = types[typeName];

    let restOfProof = convertTactics(
      block.nextConnection.targetBlock(),
      environment.concat([[name, type]]).map((x) => [x[0], lift(x[1])]),
      hypotheses.map((x) => [lift(x[0]), lift(x[1])]),
      types,
    );
    return {
      type: "abstraction",
      variable: type,
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

    let hypothesis = convertStatement(
      hypothesisBlock,
      environment,
      types,
    );
    let offsetHypothesis = lift(hypothesis);
    let hypothesisName = makeFreshVariable(environment);

    let restOfProof = convertTactics(
      block.nextConnection.targetBlock(),
      environment
        .map((x) => [x[0], lift(x[1])])
        .concat([[hypothesisName, offsetHypothesis]]),
      hypotheses
        .map((x) => [lift(x[0]), lift(x[1])])
        .concat([
          [
            {
              type: "variable",
              index: 0,
            },
            offsetHypothesis,
          ],
        ]),
      types,
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

    let conclusion = convertStatement(
      conclusionBlock,
      environment,
      hypotheses,
      types,
    );

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
            body: lift(conclusion),
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
        types,
      );
    }
    block.setWarningText(
      "Vos hypothèses ne permettent pas d'arriver à cette conclusion.",
    );
    throw new Error("Illicit conclusion in then");
  }
}

function addGlow(block, color) {
  let blockSvg = block.getSvgRoot();
  blockSvg.style.filter = `drop-shadow(0px 0px 5px ${color})`;
}

function getTopologicalOrder(dag) {
  /**
   * Returns the topological order of a directed acyclic graph
   * Fails if the provided graph is not acyclic
   * dag is a list of objects each with a name (obj.name) and an array of predecessors (obj.prev)
   */

  let visited = {};
  let order = [];

  function visit(vertex) {
    if (visited[vertex.name] == "visiting") {
      throw new Error("Circular definition");
    }
    if (!visited[vertex.name]) {
      visited[vertex.name] = "visiting";
      vertex.prev.forEach((predecessorName) => {
        const predecessor = dag.find((obj) => obj.name == predecessorName);
        if (predecessor) {
          visit(predecessor);
        }
      });
      visited[vertex.name] = "visited";
      order.push(vertex.name);
    }
  }

  dag.forEach((vertex) => {
    if (!visited[vertex.name]) {
      visit(vertex);
    }
  });

  return order;
}

function verifyTheorem(block, types) {
  /* Reads a theorem block and verifies that it is valid and that the proof is correct */

  // Read statement
  let statementBlock = block.getInput("STATEMENT").connection.targetBlock();
  if (statementBlock == null) {
    block.setWarningText("Vous n'avez pas précisé d'énoncé pour ce théorème.");
    return false;
  }
  let statement;
  try {
    statement = convertStatement(statementBlock, [], types);
  } catch (e) {
    return false;
  }

  try {
    let statementType = endive.inferType(statement);
    if (statementType.type !== "universe")
      throw new Error("Not a universe type");
  } catch (e) {
    statementBlock.setWarningText("Cet énoncé est invalide :(");
    return false;
  }

  // Read proof
  let proofBlock = block.getInput("PROOF").connection.targetBlock();
  if (proofBlock == null) {
    block.setWarningText("Vous n'avez pas prouvé ce théorème.");
    return false;
  }
  let proof;
  try {
    proof = convertTactics(proofBlock, [], [], types);
  } catch (e) {
    return false;
  }

  // Verify beta-equivalence
  let isBetaEquivalent = endive.betaEquivalent(
    endive.inferType(proof),
    statement,
  );

  if (!isBetaEquivalent) {
    block.setWarningText(
      "Cette preuve est valide, mais ne prouve pas ce que vous avez énoncé :(",
    );
    return false;
  } else {
    block.setTooltip("Preuve valide :D");
    return true;
  }
}

function getInductiveTypeDependencies(block) {
  /**
   * Takes a top-level definition block for an inductive type and returns the
   * names of definitions it depends on
   * Fails if the block is incomplete or invalid
   */

  const definitionBlocks = ["definition_inductive_type"];
  if (block.type !== "definition_inductive_type") {
    throw new Error("Not a definition block");
  }

  let dependencies = [];
  let name = block.getField("NAME").getText();
  let constructorBlock = block
    .getInput("CONSTRUCTORS")
    .connection.targetBlock();
  while (constructorBlock !== null) {
    let constructorName;
    if (constructorBlock.type == "definition_arrow_constructor") {
      let parameterBlock = constructorBlock
        .getInput("PARAMETERS")
        .connection.targetBlock();
      while (parameterBlock.type == "definition_arrow_param") {
        let parameterName = parameterBlock.getField("PARAMETER").getText();
        if (parameterName !== name && !dependencies.includes(parameterName)) {
          dependencies.push(parameterName);
        }
        parameterBlock = parameterBlock
          .getInput("NEXT")
          .connection.targetBlock();
      }
    }
    constructorBlock = constructorBlock.nextConnection.targetBlock();
  }
  return dependencies;
}

function registerInductiveTypeDefinition(block, types, constructors) {
  let typeName = block.getField("NAME").getText();
  if (typeName in types || typeName in constructors) {
    block.setWarningText(`${typeName} est déjà défini`);
    throw new Error("Unavailable name for custom type");
  }

  let fixpoint = {
    type: "fixpoint",
    target: {
      type: "universe",
      level: {
        0: 0,
      },
    },
    constructors: [],
  };

  let constructorBlock = block
    .getInput("CONSTRUCTORS")
    .connection.targetBlock();
  while (constructorBlock !== null) {
    let constructorBody = {};
    let constructorName;

    if (constructorBlock.type == "definition_simple_constructor") {
      constructorBody = {
        type: "variable",
        index: 0,
      };
    } else if (constructorBlock.type == "definition_arrow_constructor") {
      constructorBody = {
        type: "variable",
        index: 0,
      };
      let parameterBlock = constructorBlock
        .getInput("PARAMETERS")
        .connection.targetBlock();
      if (parameterBlock == null) {
        constructorBlock.setWarningText(
          "Il manque un paramètre pour ce constructeur.",
        );
        throw new Error("Missing parameter for constructor");
      }
      while (parameterBlock.type == "definition_arrow_param") {
        let parameterName = parameterBlock.getField("PARAMETER").getText();
        if (parameterName == typeName) {
          constructorBody = {
            type: "pi",
            variable: {
              type: "variable",
              index: 0,
            },
            body: lift(constructorBody),
          };
        } else if (parameterName in types) {
          constructorBody = {
            type: "pi",
            variable: types[parameterName],
            body: lift(constructorBody),
          };
        } else {
          parameterBlock.setWarningText(
            `Le type ${parameterName} n'est pas défini.`,
          );
          throw new Error("Unbound type in constructor parameter");
        }

        parameterBlock = parameterBlock
          .getInput("NEXT")
          .connection.targetBlock();
      }
    } else {
      constructorBlock.setWarningText(
        "Seuls les constructeurs sont autorisés ici.",
      );
      throw new Error("Not a constructor");
    }

    // Add this constructor to the type's constructors
    let constructor = {
      type: "abstraction",
      variable: {
        type: "universe",
        level: {},
      },
      body: constructorBody,
    };
    fixpoint.constructors.push(constructor);

    // Register this constructor under the provided name
    constructorName = constructorBlock.getField("NAME").getText();
    if (constructorName in types || constructorName in constructors) {
      constructorBlock.setWarningText(`${constructorName} est déjà défini.`);
      throw new Error("Unavailable name for custom constructor");
    }
    constructors[constructorName] = {
      type: typeName,
      index: fixpoint.constructors.length - 1,
    };

    constructorBlock = constructorBlock.nextConnection.targetBlock();
  }

  // Register this type under the provided name
  types[typeName] = fixpoint;

  return fixpoint;
}

export async function validate(workspace) {
  /**
   * Attempts to validate theorems and type definitions in the provided workspace
   */

  await intialize(url);
  let blocks = workspace.getAllBlocks();

  // Reset warnings for all blocks
  for (let i = 0; i < blocks.length; ++i) {
    blocks[i].setWarningText("");
  }

  // Get definition order for inductive types
  let inductiveTypesDAG = [];
  let inductiveTypeDefinitionOrder = [];
  for (let i = 0; i < blocks.length; ++i) {
    let block = blocks[i];
    try {
      let blockDependencies = getInductiveTypeDependencies(block);
      let name = block.getField("NAME").getText();
      inductiveTypesDAG.push({
        name: name,
        prev: blockDependencies,
      });
    } catch (e) {}
  }
  try {
    inductiveTypeDefinitionOrder = getTopologicalOrder(inductiveTypesDAG);
  } catch (e) {
    for (let i = 0; i < blocks.length; ++i) {
      let block = blocks[i];
      if (block.type.startsWith("definition")) {
        block.setWarningText(
          "L'espace de travail inclut des définitions cycliques.",
        );
      }
    }
  }

  // Define inductive types
  let types = {
    Prop: {
      type: "universe",
      level: {},
    },
  };
  let constructors = {};

  inductiveTypeDefinitionOrder.forEach(function (definitionName) {
    let block = blocks.find(
      (bl) =>
        bl.type == "definition_inductive_type" &&
        bl.getField("NAME").getText() == definitionName,
    );
    if (block) {
      registerInductiveTypeDefinition(block, types, constructors);
    }
  });

  // Verify theorems
  for (let i = 0; i < blocks.length; ++i) {
    let block = blocks[i];

    if (block.type == "theorem") {
      block.getSvgRoot().style.filter = "";
      if (verifyTheorem(block, types)) {
        addGlow(block, "#00ff00");
      } else {
        addGlow(block, "#bb0000");
      }
    }
  }
}

import intialize, * as endive from "endive-wasm";

// @ts-ignore
import url from "url:endive-wasm/endive_wasm_bg.wasm";

async function main() {
  await intialize(url);

  // Constructors take the final inductive type as first argument.
  // λℕ:U(0).ℕ
  const zero = {
    type: "abstraction",
    variable: {
      type: "universe",
      level: {},
    },
    body: {
      type: "variable",
      index: 0,
    },
  };

  // λℕ:U(0).ℕ → ℕ
  const succ = {
    type: "abstraction",
    variable: {
      type: "universe",
      level: {},
    },
    body: {
      type: "pi",
      variable: {
        type: "variable",
        index: 0,
      },
      body: {
        type: "variable",
        index: 1,
      },
    },
  };

  const N = {
    type: "fixpoint",
    target: {
      type: "universe",
      level: {},
    },
    constructors: [zero, succ],
  };

  const two = {
    type: "constructor",
    fixpoint: N,
    index: 1,
    arguments: [
      {
        type: "constructor",
        fixpoint: N,
        index: 1,
        arguments: [
          {
            type: "constructor",
            fixpoint: N,
            index: 0,
            arguments: [],
          },
        ],
      },
    ],
  };

  const three = {
    type: "constructor",
    fixpoint: N,
    index: 1,
    arguments: [two],
  };

  const five = {
    type: "constructor",
    fixpoint: N,
    index: 1,
    arguments: [
      {
        type: "constructor",
        fixpoint: N,
        index: 1,
        arguments: [three],
      },
    ],
  };

  // λn:ℕ.λm:ℕ.induction(λp:ℕ.ℕ, n, λp:ℕ.λq:ℕ.S q, m)
  const add = {
    type: "abstraction",
    variable: N,
    body: {
      type: "abstraction",
      variable: N,
      body: {
        type: "induction",
        motive: {
          type: "abstraction",
          variable: N,
          body: N,
        },
        cases: [
          {
            type: "variable",
            index: 1,
          },
          {
            type: "abstraction",
            variable: N,
            body: {
              type: "abstraction",
              variable: N,
              body: {
                type: "constructor",
                fixpoint: N,
                index: 1,
                arguments: [
                  {
                    type: "variable",
                    index: 0,
                  },
                ],
              },
            },
          },
        ],
        value: {
          type: "variable",
          index: 0,
        },
      },
    },
  };

  const addTwoThree = {
    type: "application",
    f: {
      type: "application",
      f: add,
      argument: two,
    },
    argument: three,
  };

  console.log(
    endive.betaEquivalent(endive.inferType(addTwoThree), N)
  )
  console.log(
    endive.betaEquivalent(addTwoThree, five)
  );
}

main();

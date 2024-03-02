import "./components/button";
import "./components/statementSeparator";
import "./components/definitionStatement";
import "./components/emptyStatement";
import "./components/letTactic";
import "./components/nameInput";
import "./components/patternInput";
import "./components/proofStatement";
import "./components/soTactic";
import "./components/supposeTactic";
import "./components/termInput";
import "./components/theoremStatement";
import "./components/view";
import "./components/withTactic";

import intialize, * as endive from "endive-wasm";

// @ts-ignore
import url from "url:endive-wasm/endive_wasm_bg.wasm";

async function main() {
  await intialize(url);
  console.log(endive.add(1, 2));
}

main();

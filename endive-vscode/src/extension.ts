import { ExtensionContext } from "vscode";
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
} from "vscode-languageclient/node";

let client: LanguageClient | undefined = undefined;

export function activate(context: ExtensionContext) {
  const serverOptions: ServerOptions = {
    command: context.asAbsolutePath(
      "../_build/default/endive-lsp-server/main.exe",
    ),
  };
  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: "file", language: "endive" }],
  };
  client = new LanguageClient(
    "endive",
    "Endive Language Server",
    serverOptions,
    clientOptions,
  );
  client.start();
}

export async function deactivate() {
  if (client !== undefined) await client.stop();
}

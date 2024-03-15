import {
  EditorView,
  drawSelection,
  highlightSpecialChars,
} from "@codemirror/view";
import { languageServer } from "codemirror-languageserver";
import { placeholder } from "@codemirror/view";
import {
  codeFolding,
  defaultHighlightStyle,
  foldGutter,
} from "@codemirror/language";

import { keymap } from "@codemirror/view";
import {
  insertTab,
  indentLess,
  history,
  historyKeymap,
  defaultKeymap,
} from "@codemirror/commands";

import { foldNodeProp, foldInside } from "@codemirror/language";

import { styleTags, tags } from "@lezer/highlight";

import {
  LRLanguage,
  LanguageSupport,
  HighlightStyle,
  syntaxHighlighting,
} from "@codemirror/language";
import {
  parser,
  LineComment,
  Lemma,
  Keyword,
  Number,
  Tactic,
  Type,
  Block,
} from "../endive.grammar";

var endive_syntax = new LanguageSupport(
  LRLanguage.define({
    parser: parser.configure({
      props: [
        styleTags({
          Tactic: tags.name,
          Number: tags.number,
          Lemma: tags.controlKeyword,
          Keyword: tags.keyword,
          Type: tags.typeName,
          LineComment: tags.lineComment,
        }),
        foldNodeProp.add({
          Block: foldInside,
        }),
      ],
    }),
    languageData: {
      commentTokens: { line: "/" },
    },
  }),
);

var highlighting = syntaxHighlighting(
  HighlightStyle.define([
    { tag: tags.name, color: "#B54300" },
    { tag: tags.lineComment, color: "#6C6C6C", fontStyle: "italic" },
    { tag: tags.controlKeyword, color: "#7E00D5", fontWeight: "bold" },
    { tag: tags.keyword, color: "#008A1C" },
    { tag: tags.typeName, color: "#2000FF" },
    { tag: tags.number, color: "#00c5d9" },
  ]),
);

var ls = languageServer({
  // WebSocket server uri and other client options.
  serverUri: window.location.href.includes("endiveonline.fr")
    ? "wss://endiveonline.fr/lsp"
    : "ws://0.0.0.0:9999", // if local, use local server
  rootUri: "file:///",
  workspaceFolders: null,
  /*
	// Alternatively, to share the same client across multiple instances of this plugin.
	client: new LanguageServerClient({
		serverUri,
		rootUri: 'file:///'
	}),
*/
  documentUri: `file:///coucou`,
  languageId: "cpp", // As defined at https://microsoft.github.io/language-server-protocol/specification#textDocumentItem.
});

const initialText = "";
const targetElement = document.querySelector("#editor")!;

const tabHandling = keymap.of([
  { key: "Tab", preventDefault: true, run: insertTab },
  { key: "Shift-Tab", preventDefault: true, run: indentLess },
]);

declare global {
  var editor: any;
}

globalThis.editor = new EditorView({
  doc: initialText,
  extensions: [
    highlightSpecialChars(),
    history(),
    drawSelection(),
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    keymap.of([...defaultKeymap, ...historyKeymap]),
    codeFolding(),
    foldGutter(),
    placeholder("Hi ! Start typing, or press Esc if you're lost :)"),
    ls,
    EditorView.lineWrapping,
    tabHandling,
    endive_syntax,
    highlighting,
  ],
  parent: targetElement,
});

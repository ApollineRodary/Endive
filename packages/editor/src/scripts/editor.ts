import { languageServer } from "codemirror-languageserver";
import {
  keymap,
  drawSelection,
  highlightSpecialChars,
  placeholder,
  Decoration,
  EditorView,
  WidgetType,
  DecorationSet,
} from "@codemirror/view";
import {
  codeFolding,
  foldGutter,
  foldNodeProp,
  foldInside,
  defaultHighlightStyle,
  LRLanguage,
  LanguageSupport,
  HighlightStyle,
  syntaxHighlighting,
} from "@codemirror/language";
import {
  insertTab,
  indentLess,
  history,
  defaultKeymap,
  historyKeymap,
} from "@codemirror/commands";
import { forEachDiagnostic } from "@codemirror/lint";
import { RangeSet, StateField, EditorState, Range } from "@codemirror/state";
import { styleTags, tags } from "@lezer/highlight";

import { parser } from "../endive.grammar";

interface SideLintParams {
  content: string;
  position: number;
}

class SideLintWidget extends WidgetType {
  readonly content;
  readonly position;

  constructor({ content, position }: SideLintParams) {
    super();

    this.content = content;
    this.position = position;
  }

  eq(sideLint: SideLintWidget) {
    return sideLint.content === this.content;
  }

  toDOM(view: EditorView) {
    const container = document.createElement("span");

    container.setAttribute("aria-hidden", "true");
    container.classList.add("cm-sideLint");
    let pos = this.position;
    container.onclick = function () {
      view.dispatch({ selection: { anchor: pos, head: pos } });
    };

    container.textContent = "     /" + this.content;

    return container;
  }
}

const decorate = (state: EditorState) => {
  const widgets: Range<Decoration>[] = [];
  forEachDiagnostic(
    state,
    (
      d,
      _from,
      to, //not state because we want to update even for old diags
    ) => {
      let pos = state.doc.lineAt(to).to;
      widgets.push(
        SideLintingDecoration({ content: d.message, position: pos }).range(
          state.doc.lineAt(to).to,
        ),
      );
    },
  );

  return widgets.length > 0 ? RangeSet.of(widgets) : Decoration.none;
};

const sideLinter = StateField.define<DecorationSet>({
  create(state) {
    return decorate(state);
  },
  update(_lints, transaction) {
    return decorate(transaction.state);
  },
  provide(field) {
    return EditorView.decorations.from(field);
  },
});

var endiveSyntax = new LanguageSupport(
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

const SideLintingDecoration = (params: SideLintParams) =>
  Decoration.widget({
    widget: new SideLintWidget(params),
    side: 1,
    block: false,
  });

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
    endiveSyntax,
    highlighting,
    sideLinter,
  ],

  parent: targetElement,
});

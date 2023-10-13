import {EditorView, minimalSetup} from "codemirror"
import {placeholder} from "@codemirror/view"
import {codeFolding, foldGutter} from "@codemirror/language"
import {javascript} from "@codemirror/lang-javascript"

globalThis.editor = new EditorView({
  extensions: [minimalSetup, codeFolding(), foldGutter(), javascript(), placeholder("Welcome, feel free to type something :)")],
  parent: document.body
});


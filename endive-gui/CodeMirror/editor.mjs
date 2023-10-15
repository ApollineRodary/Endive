import {EditorView, minimalSetup} from "codemirror"
import {placeholder} from "@codemirror/view"
import {codeFolding, foldGutter} from "@codemirror/language"
import {javascript} from "@codemirror/lang-javascript"


//globalThis is a nice way to put variables in the global scope, without actually polluting the global scope
globalThis.editor = new EditorView({

  //The way codemirror works is that it allows to import very modular and fine grained "extensions" in order to create a custom instance of the editor that is tailored to our needs
  //minimalSetup is a list of extension to make it work
  //codeFolding allows the user to fold some sections of his text
  //foldGutter is the bar on the left where the little arrows appear
  //javascript is an extension that handles syntax coloring for javascript. It is meant to be replaced by our LSP server
  //placeholder is a placeholder
  extensions: [minimalSetup, codeFolding(), foldGutter(), javascript(), placeholder("Welcome, feel free to type something :)")],
  parent: document.body
});


import {EditorView, minimalSetup} from "codemirror"
import { languageServer } from 'codemirror-languageserver'
import {placeholder} from "@codemirror/view"
import {codeFolding, foldGutter} from "@codemirror/language"
//import {autocompletion} from "@codemirror/autocomplete"

//import {EXAMPLE} from "../../../../testLezer/lang-example/dist/index.js"


var ls = languageServer({
	// WebSocket server uri and other client options.
	serverUri: 'ws://0.0.0.0:9999',
	rootUri: 'file:///',
	workspaceFolders : null,
/*
	// Alternatively, to share the same client across multiple instances of this plugin.
	client: new LanguageServerClient({
		serverUri,
		rootUri: 'file:///'
	}),
*/
	documentUri: `file:///coucou`,
	languageId: 'cpp' // As defined at https://microsoft.github.io/language-server-protocol/specification#textDocumentItem.
});


const initialText = ''
const targetElement = document.querySelector('#editor')!

declare global {
  var editor: any;
}

globalThis.editor = new EditorView({
  doc: initialText,
  extensions: [
    minimalSetup, codeFolding(), foldGutter(), placeholder("Welcome, feel free to type something :)"), ls
  ], 
  parent: targetElement,
})

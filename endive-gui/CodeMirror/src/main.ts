import {EditorView, minimalSetup} from "codemirror"
import { languageServer } from 'codemirror-languageserver'
import {placeholder} from "@codemirror/view"
import {codeFolding, foldGutter} from "@codemirror/language"
import {keymap} from "@codemirror/view"
import {insertTab,indentLess} from "@codemirror/commands"



var ls = languageServer({
	// WebSocket server uri and other client options.
	serverUri: window.location.href.includes("endiveonline.fr") ? 'ws://13.51.51.237:9999' : 'ws://0.0.0.0:9999',// if local, use local server
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

const tabHandling=keymap.of([{key:'Tab',preventDefault:true,run: insertTab}, {key:'Shift-Tab',preventDefault :true,run:indentLess}])

declare global {
  var editor: any;
}

globalThis.editor = new EditorView({
  doc: initialText,
  extensions: [
    minimalSetup, codeFolding(), foldGutter(), placeholder("Welcome, feel free to type something :)"), ls,EditorView.lineWrapping, tabHandling
  ], 
  parent: targetElement,
})


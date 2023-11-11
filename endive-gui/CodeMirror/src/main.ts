import {EditorView, /*minimalSetup*/} from "codemirror"
import { languageServer } from 'codemirror-languageserver'
import {placeholder} from "@codemirror/view"
import {codeFolding, foldGutter} from "@codemirror/language"

import {keymap} from "@codemirror/view"
import {insertTab,indentLess} from "@codemirror/commands"
import {forEachDiagnostic} from "@codemirror/lint"

import {foldNodeProp, foldInside} from "@codemirror/language"

import type { EditorState, Range } from '@codemirror/state'
import { RangeSet, StateField } from '@codemirror/state'
import type { DecorationSet } from '@codemirror/view'
import { Decoration, WidgetType } from '@codemirror/view'


interface SideLintParams {
  content: string,
}


class SideLintWidget extends WidgetType {
  readonly content

  constructor({ content }: SideLintParams) {
    super()

    this.content = content
  }

  eq(sideLint: SideLintWidget) {
    return sideLint.content === this.content
  }

  toDOM() {
    const container = document.createElement('span')
    
    container.setAttribute('aria-hidden', 'true')
    container.classList.add("cm-sideLint")

    container.innerHTML = "     /"+this.content

    return container
  }
}

  const decorate = (state: EditorState) => {
  
   const widgets: Range<Decoration>[] = []
                forEachDiagnostic(state, (d, _from, to) => //not state because we want to update even for old diags
                widgets.push(SideLintingDecoration({content : d.message}).range(state.doc.lineAt(to).to)
                ));

    return widgets.length > 0 ? RangeSet.of(widgets) : Decoration.none
  }

 const side_linter = StateField.define<DecorationSet>({
    create(state) {
      return decorate(state)
    },
    update(_lints, transaction) {
      //if (transaction.docChanged)
        return decorate(transaction.state)

      //return images.map(transaction.changes)
    },
    provide(field) {
      return EditorView.decorations.from(field)
    },
  })

import { styleTags, tags } from '@lezer/highlight'

import {LRLanguage, LanguageSupport, HighlightStyle, syntaxHighlighting} from "@codemirror/language"
// @ts-ignore
import {parser} from "./parser.js"
// @ts-ignore
import { LineComment, Lemma, Keyword, Number, Tactic, Type, Block } from './parser.terms.js'

var endive_syntax = new LanguageSupport(LRLanguage.define({
  parser: parser.configure({
    props: [
      styleTags({
        Tactic: tags.name,
        Number : tags.number,
        Lemma: tags.controlKeyword,
        Keyword: tags.keyword,
        Type : tags.typeName,
        LineComment: tags.lineComment,
      }),
      foldNodeProp.add({
      Block: foldInside
    })
    ]
  }),
  languageData: {
    commentTokens: {line: "/"}
  }
  
}))

var highlighting = syntaxHighlighting(HighlightStyle.define([
        {tag: tags.name, color: "#B54300"},
        {tag: tags.lineComment, color: "#6C6C6C", fontStyle: "italic"},
        {tag: tags.controlKeyword, color:"#7E00D5", fontWeight: "bold"},
        {tag: tags.keyword, color: "#008A1C"},
        {tag: tags.typeName, color: "#2000FF"},
        {tag: tags.number, color: "#00c5d9"}
    ]))

  const SideLintingDecoration = (params: SideLintParams) => Decoration.widget({
    widget: new SideLintWidget(params),
    side: 10,
    block: false,
  })





var ls = languageServer({
	// WebSocket server uri and other client options.
	serverUri: window.location.href.includes("endiveonline.fr") ? 'wss://endiveonline.fr/lsp' : 'ws://0.0.0.0:9999',// if local, use local server
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
    codeFolding(), foldGutter(), placeholder("Welcome, feel free to type something :)"), ls,EditorView.lineWrapping, tabHandling, endive_syntax, highlighting, side_linter

  ], 
  parent: targetElement,
})


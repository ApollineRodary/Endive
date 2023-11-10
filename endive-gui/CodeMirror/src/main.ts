import {EditorView, minimalSetup} from "codemirror"
import { languageServer } from 'codemirror-languageserver'
import {placeholder} from "@codemirror/view"
import {codeFolding, foldGutter} from "@codemirror/language"

import {keymap} from "@codemirror/view"
import {insertTab,indentLess} from "@codemirror/commands"

import {foldNodeProp, foldInside} from "@codemirror/language"

import type { EditorState, Range } from '@codemirror/state'
import { RangeSet, StateField } from '@codemirror/state'
import type { DecorationSet } from '@codemirror/view'
import { Decoration, WidgetType } from '@codemirror/view'


interface ImageWidgetParams {
  url: string,
}

class ImageWidget extends WidgetType {
  readonly url

  constructor({ url }: ImageWidgetParams) {
    super()

    this.url = url
  }

  eq(imageWidget: ImageWidget) {
    return imageWidget.url === this.url
  }

  toDOM() {
    const container = document.createElement('span')
    
    container.setAttribute('aria-hidden', 'true')
    container.style.width = 'fit-content'

    container.innerHTML = "     /"+this.url

    return container
  }
}

  const imageRegex = /!\[.*?\]\((?<url>.*?)\)/

  const imageDecoration = (imageWidgetParams: ImageWidgetParams) => Decoration.widget({
    widget: new ImageWidget(imageWidgetParams),
    side: 10,
    block: false,
  })

  const decorate = (state: EditorState) => {
    const widgets: Range<Decoration>[] = []

    const result = imageRegex.exec(state.doc.toString())

    if (result && result.groups && result.groups.url)
    widgets.push(imageDecoration({ url: result.groups.url }).range(state.doc.line(3).to))

    return widgets.length > 0 ? RangeSet.of(widgets) : Decoration.none
  }

  const imagesField = StateField.define<DecorationSet>({
    create(state) {
      return decorate(state)
    },
    update(images, transaction) {
      if (transaction.docChanged)
        return decorate(transaction.state)

      return images.map(transaction.changes)
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
    minimalSetup, codeFolding(), foldGutter(), placeholder("Welcome, feel free to type something :)"), ls,EditorView.lineWrapping, tabHandling, endive_syntax, highlighting, imagesField

  ], 
  parent: targetElement,
})


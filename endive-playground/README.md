Build the WebAssembly package:

```sh
cd crates/endive-wasm
wasm-pack build --target=web
```

Start an HTTP server at `http://localhost:1234`:

```sh
npm run serve
```

Currently the playground supports Endive tactics `then` (`so`? we haven't done the arguing yet but that's on my to-do-list), `let` (only supporting type `Prop`), and `suppose`. The only things that can be proven are implications, but a few blocks with no function (OR, AND, lemmas) have been implemented.

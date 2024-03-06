Build the WebAssembly package:
```sh
cd crates/endive-wasm
wasm-pack build --target=web
```

Start an HTTP server at `http://localhost:1234` to develop:
```sh
npm run serve
```
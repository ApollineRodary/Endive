type pos = { line : int; column : int }
type span = { start : pos; end_ : pos }
type 'a annotated = { el : 'a; span : span option }

let fresh el = { el; span = None }
let map f { el; span } = { el = f el; span }

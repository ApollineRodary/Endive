(lang dune 3.6)

(name endive)

(generate_opam_files true)

(source
 (github ApollineRodary/Endive))

(license MIT)

(package
 (name endive)
 (synopsis "A proof assistant for the Integrated Project computer science course at ENS de Lyon")
 (depends ocaml dune lsp))

(using menhir 2.1)

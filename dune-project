(lang dune 3.6)
(using menhir 2.1)

(name endive)

(source (github ApollineRodary/Endive))
(maintainers "The Endive contributors")
(authors "The Endive contributors")
(license MIT)

(package
 (name endive)
 (synopsis "A proof assistant for the Integrated Project computer science course at ENS de Lyon")
 (depends
   dune
   lsp
   menhir
   ocaml
   (ocamlformat :with-test)
   (ppx_inline_test :with-test)
   sexplib))

(generate_opam_files true)

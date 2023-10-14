(lang dune 3.6)
(using menhir 2.1)

(name endive)

(source (github ApollineRodary/Endive))
(license MIT)

(package
 (name endive)
 (synopsis "A proof assistant for the Integrated Project computer science course at ENS de Lyon")
 (depends
   dune
   lsp
   menhir
   ocaml
   (ocamlformat :with-test)))

(generate_opam_files true)

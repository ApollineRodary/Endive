{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";

    gitignore = {
      url = "github:hercules-ci/gitignore.nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = { self, nixpkgs, flake-utils, gitignore }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
        lib = pkgs.lib;
      in
      {
        packages.endive = pkgs.ocamlPackages.buildDunePackage {
          pname = "endive";
          version = "0.1.0";

          src = gitignore.lib.gitignoreSource ./.;

          nativeBuildInputs = with pkgs.ocamlPackages; [
            menhir
          ];

          propagatedBuildInputs = with pkgs.ocamlPackages; [
            lsp
            menhirLib
          ];

          duneVersion = "3";

          meta = {
            description = "A proof assistant for the Integrated Project computer science course at ENS de Lyon";
            license = lib.licenses.mit;
            homepage = "https://github.com/ApollineRodary/Endive";
          };
        };

        packages.endive-frontend = ./endive-gui/Interface;

        devShell = pkgs.mkShell {
          buildInputs = with pkgs; [
            ocaml
            ocamlformat
            ocamlPackages.dune_3
            ocamlPackages.menhir
            opam
          ];
        };

        formatter = pkgs.nixpkgs-fmt;
      });
}

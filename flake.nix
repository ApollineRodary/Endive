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
    {
      nixosModules.default = { config, lib, pkgs, ... }:
        let
          cfg = config.services.endive-lsp-ws;
          description = "A WebSocket proxy for Endive's LSP server";
        in
        {
          options = {
            services.endive-lsp-ws = {
              enable = lib.mkEnableOption description;

              listenAddress = lib.mkOption {
                type = lib.types.str;
                default = "127.0.0.1:9999";
                description = "Address or port to listen on";
              };
            };
          };

          config = lib.mkIf cfg.enable {
            systemd.services.endive-lsp-ws = {
              inherit description;

              wantedBy = [ "multi-user.target" ];
              restartIfChanged = true;

              serviceConfig = {
                Type = "simple";
                ExecStart = "${self.packages.${pkgs.system}.lsp-ws-proxy}/bin/lsp-ws-proxy --listen ${cfg.listenAddress} -- ${self.packages.${pkgs.system}.endive}/bin/endive-lsp-server";
                Restart = "on-failure";
                User = "nobody";

                PrivateDevices = true;
                PrivateTmp = "yes";
                ProtectSystem = "strict";
              };
            };
          };
        };
    } // flake-utils.lib.eachDefaultSystem (system:
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

        packages.lsp-ws-proxy =
          let
            src = pkgs.fetchFromGitHub {
              owner = "qualified";
              repo = "lsp-ws-proxy";
              rev = "452a29d43cb604ecb5c82a2cc3f34f664a5ba345";
              hash = "sha256-Ok4L9mLa29DF1UsO9ej6sGF/mB1er7AVWi99CZbNQe8=";
            };
          in
          pkgs.rustPlatform.buildRustPackage {
            inherit src;

            pname = "lsp-ws-proxy";
            version = "0.9.0-rc.4";

            cargoLock = {
              lockFile = "${src}/Cargo.lock";
              outputHashes = {
                "tokio-tungstenite-0.15.0" = "sha256-V19SIMh4VSM4RxdlxnxrKZim/1R87o34ef0c2HzOHoQ=";
                "tungstenite-0.15.0" = "sha256-/KhhMma2SWqw68OImxE98tYbcq1AssPDVMsHLlIusiY=";
                "warp-0.3.1" = "sha256-qXo3sNgpKOroW4WXpRaW8HJFhfkm+6xU7uxXNpIBFTY=";
              };
            };
          };

        devShell = pkgs.mkShell {
          buildInputs = with pkgs; [
            cargo
            ocaml
            ocamlformat
            ocamlPackages.dune_3
            ocamlPackages.menhir
            opam
            rust-analyzer
            rustc
            rustfmt
          ];

          RUST_SRC_PATH = "${pkgs.rustPlatform.rustLibSrc}";
        };

        formatter = pkgs.nixpkgs-fmt;
      });
}

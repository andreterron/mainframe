{ pkgs ? import <nixpkgs> {} # here we import the nixpkgs package set
}:
pkgs.mkShell {
  name="mainframe-shell";
  buildInputs = with pkgs; [
    nodejs-18_x
    bash
  ];
}

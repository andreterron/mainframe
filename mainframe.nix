{ config, pkgs, lib, ... }:

{
  systemd.services.mainframe = {
    wantedBy = [ "multi-user.target" ];
    after = [
        "network.target"
        "docker.service"
        "docker.socket"
    ];
    description = "Start Mainframe";
    path = [
        pkgs.docker
    ];
    serviceConfig = {
      WorkingDirectory = ./.;
      ExecStart = "${pkgs.yarn}/bin/yarn start";
    };
  };

  environment.systemPackages = with pkgs.buildPackages; [
    nodejs-18_x
    yarn
  ];
}

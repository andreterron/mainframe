{ config, pkgs, lib, ... }:

{
  systemd.services.mainframe = {
    wantedBy = [ "multi-user.target" ];
    after = [
        "network.target"
    ];
    description = "Start Mainframe";
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

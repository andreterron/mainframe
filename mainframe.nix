{ config, pkgs, lib, ... }:

let
    cfg = config.services.mainframe;
in

with lib;

{
    options = {
        services.mainframe = {
            user = mkOption {
                default = "root";
                type = with types; uniq string;
                description = ''
                    Name of the user.
                '';
            };
        };
    };

    config = {
        systemd.services.mainframe = {
            wantedBy = [ "multi-user.target" ];
            after = [
                "network.target"
            ];
            description = "Start Mainframe";
            serviceConfig = {
                WorkingDirectory = ./.;
                ExecStart = "${pkgs.yarn}/bin/yarn start";
                User = "${cfg.user}";
            };
        };

        environment.systemPackages = with pkgs.buildPackages; [
            nodejs-18_x
            yarn
        ];
    };
}

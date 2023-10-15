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
            path = with pkgs; [ bash nodejs-18_x ];
            serviceConfig = {
                WorkingDirectory = ./.;
                ExecStart = "${pkgs.nodejs-18_x}/bin/npm run start";
                User = "${cfg.user}";
            };
        };

        environment.systemPackages = with pkgs.buildPackages; [
            nodejs-18_x
            bash
        ];
    };
}

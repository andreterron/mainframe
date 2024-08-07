---
title: Auto launch with systemd
---

If you want your Mainframe to launch with your Linux system, you can use systemd services for that. The following steps assume you are in the root folder of your Mainframe:

1. Generate the service file with `node scripts/generate-service.mjs`
2. Run the commands returned by that script, or these:
   1. `sudo cp scripts/mainframe.service /etc/systemd/system/mainframe.service`
   2. `sudo systemctl enable mainframe`
   3. `sudo systemctl start mainframe`

If you run into issues, or need to see your Mainframe logs, run `journalctl -u mainframe` to see all logs, or `journalctl -f -u mainframe` to get a live feed of logs.

## Notes

If the `mainframe.service` file is updated, run `systemctl daemon-reload` to refresh systemd's cached version

import { writeFile } from "fs/promises"
import { resolve, dirname } from "path";
import { homedir, userInfo } from "os";
import { fileURLToPath } from 'url';

// TODO: import.meta is empty on cjs bundle
const __dirname = fileURLToPath(dirname(import.meta.url));

const repoFolder = resolve(__dirname, '..')
console.log(__dirname, repoFolder)
const filepath = resolve(repoFolder, 'mainframe.service')

// Run `systemctl daemon-reload` if this file is updated!
await writeFile(filepath, `[Unit]
Description=Mainframe
After=network.target

[Service]
WorkingDirectory=${repoFolder}
ExecStart=${homedir()}/.nvm/nvm-exec npm run start
Restart=on-failure
User=${userInfo().username}

[Install]
WantedBy=multi-user.target`, 'utf8');

console.log("Your mainframe.service file was generated at:\n")
console.log(filepath)
// TODO: Check if it's sudo, and run the commands directly
console.log("Run the following commands to install the service:\n")
// Copy the service file
console.log(`sudo cp ${filepath} /etc/systemd/system/mainframe.service`)
// Enable and Start the service
console.log(`sudo systemctl enable mainframe`);
console.log(`sudo systemctl start mainframe`);

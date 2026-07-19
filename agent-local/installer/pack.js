const archiver = require("archiver");
const fs = require("fs");
const path = require("path");

const installerDir = __dirname;
const outFile = path.join(installerDir, "pesohub-agent-local-installer.zip");

if (fs.existsSync(outFile)) fs.unlinkSync(outFile);

const output = fs.createWriteStream(outFile);
const archive = archiver("zip", { zlib: { level: 9 } });

output.on("close", () => {
  console.log(`Instalador gerado: ${outFile} (${archive.pointer()} bytes)`);
});
archive.on("error", (err) => {
  throw err;
});
archive.pipe(output);

archive.file(path.join(installerDir, "install.ps1"), { name: "install.ps1" });
archive.file(path.join(installerDir, "uninstall.ps1"), { name: "uninstall.ps1" });
archive.file(path.join(installerDir, "bin", "agent-local.exe"), { name: "bin/agent-local.exe" });
archive.file(path.join(installerDir, "bin", "nssm.exe"), { name: "bin/nssm.exe" });

archive.finalize();

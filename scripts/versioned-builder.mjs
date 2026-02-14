import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const pkg = JSON.parse(readFileSync(path.join(rootDir, "package.json"), "utf8"));
const version = String(pkg.version || "dev").trim() || "dev";
const outputDir = `release/v${version}`;

const builderArgs = process.argv.slice(2);
const cmd = process.execPath;
const builderCli = path.join(rootDir, "node_modules", "electron-builder", "cli.js");
const args = [
  builderCli,
  `--config.directories.output=${outputDir}`,
  ...builderArgs
];

const child = spawn(cmd, args, {
  cwd: rootDir,
  stdio: "inherit",
  env: process.env
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});

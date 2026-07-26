// VS Code's integrated terminal (and some other Electron-hosted terminals) set
// ELECTRON_RUN_AS_NODE=1 in their environment. That variable leaks into child
// processes, so spawning `electron .` directly from such a terminal silently
// runs Electron as plain Node instead of launching the GUI - no window, no error.
// Stripping it here before spawning fixes that regardless of which terminal
// this was launched from.
delete process.env.ELECTRON_RUN_AS_NODE;

const { spawn } = require("node:child_process");
const electronPath = require("electron");

const child = spawn(electronPath, ["."], {
  stdio: "inherit",
  env: { ...process.env, NODE_ENV: "development" },
});

child.on("close", (code) => process.exit(code ?? 0));

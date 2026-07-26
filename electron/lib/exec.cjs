const { execFile } = require("node:child_process");

/**
 * Runs a fixed PowerShell script (no string-interpolated user input).
 * Any dynamic values must be passed via `env` and referenced in the script
 * as $env:VAR_NAME, never concatenated into the script text itself -
 * this keeps user-controlled strings (service names, paths, pids, ...)
 * from ever being parsed as PowerShell code.
 */
function runPowerShell(script, { env = {}, timeout = 20000 } = {}) {
  return new Promise((resolve, reject) => {
    execFile(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", script],
      {
        windowsHide: true,
        timeout,
        maxBuffer: 1024 * 1024 * 16,
        env: { ...process.env, ...env },
      },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(stderr?.trim() || error.message));
          return;
        }
        resolve(stdout.trim());
      }
    );
  });
}

/** Runs a script and parses its stdout as JSON (script should end with ConvertTo-Json). */
async function runPowerShellJson(script, opts) {
  const out = await runPowerShell(script, opts);
  if (!out) return [];
  const parsed = JSON.parse(out);
  return Array.isArray(parsed) ? parsed : [parsed];
}

/** Runs a fixed executable with argv-array arguments (no shell, no injection risk). */
function runCommand(file, args, { timeout = 20000 } = {}) {
  return new Promise((resolve, reject) => {
    execFile(file, args, { windowsHide: true, timeout, maxBuffer: 1024 * 1024 * 8 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr?.trim() || error.message));
        return;
      }
      resolve(stdout.trim());
    });
  });
}

module.exports = { runPowerShell, runPowerShellJson, runCommand };

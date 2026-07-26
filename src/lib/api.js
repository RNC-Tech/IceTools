/**
 * Every preload-exposed method resolves { ok, data } or { ok:false, error }.
 * `call` unwraps that envelope and throws so callers can use plain try/catch.
 */
export async function call(promise) {
  const result = await promise;
  if (!result.ok) throw new Error(result.error || "Unknown error");
  return result.data;
}

export function formatBytes(bytes) {
  if (bytes === null || bytes === undefined) return "-";
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

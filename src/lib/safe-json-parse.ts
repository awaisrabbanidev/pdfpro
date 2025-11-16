// Add this helper to log any non-JSON data that your code is trying to parse:
export function safeJsonParse(maybeJson: any, label = "") {
  if (typeof maybeJson !== "string") {
    console.warn(`[safeJsonParse:${label}] not a string; type=${typeof maybeJson}`);
    return null;
  }
  const s = maybeJson.trim();
  if (!s.startsWith("{") && !s.startsWith("[")) {
    console.warn(`[safeJsonParse:${label}] not JSON text (first 200 chars):`, s.slice(0, 200));
    return null;
  }
  try {
    return JSON.parse(s);
  } catch (err) {
    console.error(`[safeJsonParse:${label}] JSON.parse failed:`, (err as Error).message);
    console.error(`[safeJsonParse:${label}] raw (first 200 chars):`, s.slice(0, 200));
    return null;
  }
}

// Important: replace any JSON.parse(someVariable) in your code with safeJsonParse(someVariable, "description").
// That will stop the 500 and give useful debug output in Vercel logs showing the raw text that triggered the parse error.
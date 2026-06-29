const DOCS_ORIGIN = "https://docs.dappnode.io/";

export function trimTrailingSlashes(value: string): string {
  let end = value.length;
  while (end > 0 && value.charCodeAt(end - 1) === 47) end--;
  return value.slice(0, end);
}

function isAsciiWhitespace(char: string): boolean {
  const code = char.charCodeAt(0);
  return code === 9 || code === 10 || code === 11 || code === 12 || code === 13 || code === 32;
}

function isUrlTerminator(char: string | undefined): boolean {
  return char === undefined || char === ")" || isAsciiWhitespace(char);
}

export function trimAsciiWhitespace(value: string): string {
  let start = 0;
  let end = value.length;
  while (start < end && isAsciiWhitespace(value[start])) start++;
  while (end > start && isAsciiWhitespace(value[end - 1])) end--;
  return value.slice(start, end);
}

export function containsAsciiWhitespace(value: string): boolean {
  for (let i = 0; i < value.length; i++) {
    if (isAsciiWhitespace(value[i])) return true;
  }
  return false;
}

export function collapseWhitespace(value: string): string {
  let out = "";
  let lastWasWhitespace = false;
  for (let i = 0; i < value.length; i++) {
    const char = value[i];
    if (isAsciiWhitespace(char)) {
      if (!lastWasWhitespace) out += " ";
      lastWasWhitespace = true;
    } else {
      out += char;
      lastWasWhitespace = false;
    }
  }
  return trimAsciiWhitespace(out);
}

export function canonicalDocUrl(url: string): string {
  const trimmed = trimTrailingSlashes(url);
  return trimmed.toLowerCase().endsWith(".md") ? trimmed.slice(0, -3) : trimmed;
}

export function rawMarkdownUrl(canonical: string): string {
  return canonical.toLowerCase().endsWith(".md") ? canonical : canonical + ".md";
}

export function stripMdFromDocsUrls(body: string): string {
  let cursor = 0;
  let output = "";

  for (;;) {
    const start = body.indexOf(DOCS_ORIGIN, cursor);
    if (start === -1) {
      output += body.slice(cursor);
      return output;
    }

    output += body.slice(cursor, start);

    let end = start;
    while (end < body.length && !isUrlTerminator(body[end])) end++;

    output += canonicalDocUrl(body.slice(start, end));
    cursor = end;
  }
}

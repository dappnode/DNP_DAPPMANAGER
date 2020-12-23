// MARKDOWN UTILS
export function bold(message: string): string {
  return "*" + message + "*";
}

export function italic(message: string): string {
  return "_" + message + "_";
}

export function hashtag(message: string): string {
  return "#" + message;
}

export function url(inlineUrl: string, url: string): string {
  return "[" + inlineUrl + "]" + "(" + url + ")";
}

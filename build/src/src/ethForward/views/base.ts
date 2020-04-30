/* eslint-disable max-len */
const logoSrcBase64 =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABVCAMAAADpApMsAAAC31BMVEVHcEytra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra2tra25QZdfAAAA9HRSTlMABwr5/e/+AQL6+/YMBOoY8QPy/PMkCA715RPZCRLw6+YF3JZp7VcwDcXoPyND9MQdHiXJzPgbFFXdKKEfiX3TSNrbN+njgLJ5c3ca4Ijna6RlTSocoNTsJxdGWCIxfIufsBXChMcmIGyzEUczWRZC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";

/**
 * Base template
 * @param title "Page Not Found"
 * @param body Mark up HTML to inject into the body <p></p>
 * `Please wait until the chain is synced to browse decentralized webs
 * <br/>
 * Go to the <a href="http://my.admin.dnp.dappnode.eth/">Admin UI</a> to check the sync status
 * `
 */
export function base(title: string, body: string, e?: Error): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${title}</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  body {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    width: 100vw;
    color: #888;
    font-family: sans-serif;
    text-align: center;
  }

  * { line-height: 1.2; margin: 0; }
  h1 { color: #555; font-size: 2em; font-weight: 400; }
  p { max-width: 400px; }
  a { color: #4db6a7; text-decoration: none; }
  details { opacity: 0.75; white-space: pre; text-align: left; }
</style>
</head>

<body>
  <img width="60" src=${logoSrcBase64} />
  <h1>${title}</h1>
  <p>${body}</p>
  ${
    // Add a detail element with the error message add the stack hidden
    e
      ? `
  <details>
    <summary>${(e.message || "").split("\n")[0]}</summary>
    ${e.stack}
  </details>
  `
      : ""
  }
</body>
</html>
  `;
}

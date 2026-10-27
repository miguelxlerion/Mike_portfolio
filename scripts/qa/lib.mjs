import fs from "node:fs";
import path from "node:path";

export const BASE = (process.env.QA_BASE ?? "http://127.0.0.1:4323").replace(/\/$/, "");
export const OUT = path.resolve(process.env.QA_OUT ?? "qa-output");
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function connect() {
  const cdp = (process.env.QA_CDP ?? "http://127.0.0.1:9222").replace(/\/$/, "");
  let targets;

  try {
    targets = await (await fetch(`${cdp}/json/list`)).json();
  } catch {
    throw new Error(
      `No CDP endpoint at ${cdp}. Start Chrome with --remote-debugging-port=9222 and run "npm run preview -- --port 4323".`,
    );
  }

  const page = targets.find(
    (target) => target.type === "page" && !target.url.startsWith("devtools"),
  );
  if (!page) throw new Error("No page target found in Chrome.");

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  const pending = new Map();
  const errors = [];
  let nextId = 0;

  ws.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
    }
    if (message.method === "Runtime.exceptionThrown") {
      errors.push(message.params.exceptionDetails.text);
    }
  });

  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener(
      "error",
      () => reject(new Error(`Cannot open ${page.webSocketDebuggerUrl}`)),
      { once: true },
    );
  });

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++nextId;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });

  async function evaluate(fn, ...args) {
    const expression =
      typeof fn === "function"
        ? `(${fn.toString()})(${args.map((arg) => JSON.stringify(arg)).join(",")})`
        : fn;
    const result = await send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
    }
    return result.result.value;
  }

  async function waitFor(predicate, timeout = 8000, interval = 150) {
    const started = Date.now();
    while (Date.now() - started < timeout) {
      try {
        if (await evaluate(predicate)) return true;
      } catch {}
      await sleep(interval);
    }
    return false;
  }

  async function navigate(url, settle = 2400) {
    try {
      await send("Page.navigate", { url });
    } catch {}
    await sleep(settle);
    await waitFor(() => document.readyState === "complete");
  }

  async function screenshot(name) {
    const result = await send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: false,
    });
    fs.mkdirSync(OUT, { recursive: true });
    const file = path.join(OUT, name);
    fs.writeFileSync(file, Buffer.from(result.data, "base64"));
    return file;
  }

  async function viewport(width, height, mobile) {
    await send("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: mobile ? 2 : 1,
      mobile,
    });
  }

  await send("Runtime.enable");
  await send("Page.enable");

  return { send, evaluate, waitFor, navigate, screenshot, viewport, errors, close: () => ws.close() };
}

export function createReport() {
  const checks = [];

  return {
    check(name, ok, detail) {
      checks.push({ name, ok: Boolean(ok), detail });
      const suffix =
        ok || detail === undefined
          ? ""
          : ` -> ${typeof detail === "string" ? detail : JSON.stringify(detail)}`;
      console.log(`${ok ? "PASS" : "FAIL"} ${name}${suffix}`);
    },
    finish(extra = {}) {
      const failed = checks.filter((entry) => !entry.ok).map((entry) => entry.name);
      console.log(JSON.stringify({ ...extra, checks, failed }, null, 2));
      if (failed.length) process.exitCode = 1;
      return failed.length === 0;
    },
  };
}

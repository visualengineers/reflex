const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const os = require('node:os');
const { spawn, spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
if (typeof WebSocket === 'undefined') throw new Error('Electron smoke tests require Node.js 22 or later.');
const application = process.argv[2];
if (!['emulator', 'server'].includes(application)) throw new Error('Usage: npm run smoke:electron -- <emulator|server>');
const output = path.join(root, application === 'emulator' ? 'tools/emulator/release' : 'tools/ReFlex.TrackingServer/bin/Desktop');
const target = JSON.parse(fs.readFileSync(path.join(output, 'smoke-target.json')));
const nativePlatform = { darwin: 'osx', win32: 'win', linux: 'linux' }[process.platform];
if (target.platform !== nativePlatform || target.arch !== process.arch) throw new Error('Smoke tests must run on the packaged app\'s native OS and architecture.');
const artifacts = path.join(root, 'test/artifacts/electron', application);
fs.mkdirSync(artifacts, { recursive: true });
const log = fs.createWriteStream(path.join(artifacts, 'startup.log'));
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function freePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}

// Use the stable page-level DevTools protocol directly. This also works with
// Electron 23, whose browser target discovery predates current Puppeteer.
async function connectPage(url) {
  const socket = new WebSocket(url);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  let sequence = 0;
  const pending = new Map();
  const errors = [];
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.method === 'Runtime.exceptionThrown') {
      const detail = message.params.exceptionDetails;
      errors.push(detail.exception?.description || detail.text);
    }
    const request = pending.get(message.id);
    if (request) {
      clearTimeout(request.timeout);
      pending.delete(message.id);
      if (message.error) request.reject(new Error(message.error.message));
      else request.resolve(message.result);
    }
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence;
    const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 10_000);
    pending.set(id, { resolve, reject, timeout });
    socket.send(JSON.stringify({ id, method, params }));
  });
  await send('Runtime.enable');
  return { send, errors, close: () => socket.close() };
}

(async () => {
  const port = await freePort();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), `reflex-${application}-smoke-`));
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;
  const child = spawn(target.executable, [
    `--remote-debugging-port=${port}`, '--remote-debugging-address=127.0.0.1',
    `--user-data-dir=${profile}`, '--disable-http-cache',
    '--enable-logging', '--no-sandbox', '--disable-gpu'
  ], { env, cwd: path.dirname(target.executable), detached: process.platform !== 'win32' });
  let launchError;
  child.once('error', error => { launchError = error; });
  child.stdout.on('data', chunk => log.write(chunk));
  child.stderr.on('data', chunk => log.write(chunk));
  const pages = new Map();
  let interrupted = false;
  const onSignal = () => { interrupted = true; };
  process.once('SIGINT', onSignal);
  process.once('SIGTERM', onSignal);
  let page;
  const screenshot = async () => {
    if (!page) return;
    const { data } = await page.send('Page.captureScreenshot');
    fs.writeFileSync(path.join(artifacts, 'startup.png'), Buffer.from(data, 'base64'));
  };
  const evaluate = async (client, expression) => {
    const result = await client.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  };
  try {
    const deadline = Date.now() + 120_000;
    const selector = application === 'emulator'
      ? 'app-root[ng-version] app-canvas canvas'
      : 'app-root[ng-version] app-home';
    while (!page && Date.now() < deadline) {
      if (interrupted) throw new Error('Smoke test interrupted.');
      if (launchError) throw launchError;
      if (child.exitCode !== null || child.signalCode !== null) throw new Error(`App exited during startup: ${child.exitCode ?? child.signalCode}`);
      try {
        const response = await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(2000) });
        for (const info of await response.json()) {
          if (info.type !== 'page') continue;
          if (!pages.has(info.id)) pages.set(info.id, await connectPage(info.webSocketDebuggerUrl));
          const candidate = pages.get(info.id);
          if (await evaluate(candidate, `!!document.querySelector(${JSON.stringify(selector)})`)) { page = candidate; break; }
        }
      } catch { /* The debugger or page is still starting/navigating. */ }
      if (!page) await delay(500);
    }
    if (!page) throw new Error(`Angular UI did not become ready within 120 seconds: ${selector}`);
    if (application === 'server') {
      const status = await evaluate(page, `(async () => {
        const response = await fetch('/api/versionInfo');
        const body = await response.json();
        return { ok: response.ok, isArray: Array.isArray(body) };
      })()`);
      if (!status.ok || !status.isArray) throw new Error(`Backend version endpoint failed: ${JSON.stringify(status)}`);
    }
    await delay(2000);
    if (child.exitCode !== null || child.signalCode !== null) throw new Error('App crashed after its initial render.');
    if (page.errors.length) throw new Error(`Renderer errors: ${page.errors.join('\n')}`);
    await screenshot();
    console.log(`PASS: packaged ${application} (${target.platform}/${target.arch}) rendered its Angular UI${application === 'server' ? ' and answered its backend API' : ''}.`);
  } finally {
    await screenshot().catch(() => {});
    for (const client of pages.values()) client.close();
    // Avoid recording expected shutdown errors or writing after log.end().
    child.stdout.removeAllListeners('data');
    child.stderr.removeAllListeners('data');
    if (child.pid) {
      if (process.platform === 'win32') {
        spawnSync('taskkill', ['/pid', String(child.pid), '/t', '/f'], { stdio: 'ignore' });
      } else {
        try { process.kill(-child.pid, 'SIGTERM'); } catch { /* Already exited. */ }
        await delay(1000);
        try { process.kill(-child.pid, 'SIGKILL'); } catch { /* Already exited. */ }
      }
    }
    log.end();
    fs.rmSync(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
    process.removeListener('SIGINT', onSignal);
    process.removeListener('SIGTERM', onSignal);
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

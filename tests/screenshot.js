import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, extname } from 'node:path';
import { spawn } from 'node:child_process';

const issue = process.argv[2] || 'test';
const port = Number(process.argv[3]) || (5000 + (parseInt(issue, 10) || 1));
const debugPort = port + 1000;
const rootDir = process.cwd();

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
};

// 1. Start local static HTTP server
const server = createServer((req, res) => {
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/index.html';
  const filePath = join(rootDir, urlPath);

  if (existsSync(filePath)) {
    const ext = extname(filePath);
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    res.end(readFileSync(filePath));
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(port, '127.0.0.1', async () => {
  try {
    await capture();
    process.exit(0);
  } catch (err) {
    console.error('Screenshot failed:', err);
    process.exit(1);
  } finally {
    server.close();
  }
});

async function capture() {
  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  if (!existsSync(chromePath)) {
    throw new Error(`Chrome not found at ${chromePath}`);
  }

  const chromeProc = spawn(chromePath, [
    '--headless',
    '--disable-gpu',
    `--remote-debugging-port=${debugPort}`,
    '--hide-scrollbars',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=/tmp/tp-shot-${issue}`,
    'about:blank',
  ], { stdio: 'ignore' });

  try {
    // Wait for Chrome remote debugging endpoint
    let wsUrl = null;
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 100));
      try {
        const resp = await fetch(`http://127.0.0.1:${debugPort}/json`);
        if (resp.ok) {
          const list = await resp.json();
          const page = list.find((p) => p.type === 'page');
          if (page && page.webSocketDebuggerUrl) {
            wsUrl = page.webSocketDebuggerUrl;
            break;
          }
        }
      } catch {}
    }

    if (!wsUrl) throw new Error('Could not connect to Chrome DevTools endpoint');

    // Connect via native WebSocket
    const ws = new WebSocket(wsUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let msgId = 1;
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const id = msgId++;
      const handler = (evt) => {
        const data = JSON.parse(evt.data);
        if (data.id === id) {
          ws.removeEventListener('message', handler);
          if (data.error) reject(new Error(data.error.message));
          else resolve(data.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });

    // Mobile device emulation: 390x844 (standard mobile viewport)
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true,
    });

    // Navigate to local server
    await send('Page.enable');
    await send('Page.navigate', {
      url: `http://127.0.0.1:${port}/?user=u-1001`,
    });

    // Wait until the app has replaced the "Loading your trip…" card (5 s cap),
    // then a short settle for fonts and layout.
    await send('Runtime.enable');
    const deadline = Date.now() + 5000;
    let loaded = false;
    while (Date.now() < deadline) {
      const { result } = await send('Runtime.evaluate', {
        expression: '!document.querySelector(".loading")',
        returnByValue: true,
      });
      if (result && result.value === true) { loaded = true; break; }
      await new Promise((r) => setTimeout(r, 150));
    }
    if (!loaded) console.warn('Warning: app still showed the loading card after 5 s; capturing anyway');
    await new Promise((r) => setTimeout(r, 400));

    // Capture screenshot
    const { data: base64Data } = await send('Page.captureScreenshot', { format: 'png' });
    ws.close();

    mkdirSync(join(rootDir, 'docs/evidence'), { recursive: true });
    const outPath = join(rootDir, `docs/evidence/issue-${issue}.png`);
    writeFileSync(outPath, Buffer.from(base64Data, 'base64'));
    console.log(`Saved screenshot: ${outPath}`);
  } finally {
    chromeProc.kill();
  }
}

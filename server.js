const express = require('express');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;

// When and what this instance is — useful for confirming which PR/pod you actually hit
const STARTED_AT = new Date().toISOString();
const APP_VERSION = process.env.APP_VERSION || '1.0.0';
const PR_NUMBER = process.env.PR_NUMBER || null;
const HOSTNAME = os.hostname();

app.use(express.json());

// --- Health check ---------------------------------------------------------
// Kept intentionally dumb and fast: no DB, no downstream calls, no auth.
// This is what your controller/Ingress/readiness probes should hit.
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    hostname: HOSTNAME,
    uptime_seconds: Math.floor(process.uptime()),
    started_at: STARTED_AT,
    version: APP_VERSION,
  });
});

// Separate liveness vs readiness in case your controller/K8s config wants them distinct.
app.get('/livez', (req, res) => res.status(200).send('ok'));
app.get('/readyz', (req, res) => res.status(200).send('ok'));

// --- Basic info page -------------------------------------------------------
app.get('/', (req, res) => {
  res.status(200).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>Preview Sample App</title>
      <style>
        body { font-family: system-ui, sans-serif; max-width: 640px; margin: 60px auto; padding: 0 20px; color: #222; }
        code { background: #f4f4f4; padding: 2px 6px; border-radius: 4px; }
        .badge { display: inline-block; background: #16a34a; color: white; padding: 2px 10px; border-radius: 999px; font-size: 0.85em; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        td, th { text-align: left; padding: 6px 8px; border-bottom: 1px solid #eee; }
      </style>
    </head>
    <body>
      <h1>Preview Sample App <span class="badge">running</span></h1>
      <p>This is the fixed, boring sample app used to exercise the preview platform.
         It exists to prove the pipeline works end to end &mdash; it deliberately does nothing interesting on its own.</p>
      <table>
        <tr><th>Hostname (pod)</th><td>${HOSTNAME}</td></tr>
        <tr><th>Version</th><td>${APP_VERSION}</td></tr>
        <tr><th>PR number</th><td>${PR_NUMBER ?? 'n/a (not set)'}</td></tr>
        <tr><th>Started at</th><td>${STARTED_AT}</td></tr>
        <tr><th>Uptime</th><td>${Math.floor(process.uptime())}s</td></tr>
      </table>
      <p>Endpoints: <code>GET /</code>, <code>GET /health</code>, <code>GET /livez</code>, <code>GET /readyz</code>, <code>GET /api/echo</code></p>
    </body>
    </html>
  `);
});

// A tiny endpoint that actually does something, so you can confirm requests
// are hitting the right namespace/pod and not a cached/stale one.
app.get('/api/echo', (req, res) => {
  res.status(200).json({
    hostname: HOSTNAME,
    pr_number: PR_NUMBER,
    query: req.query,
    timestamp: new Date().toISOString(),
  });
});

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ error: 'not_found', path: req.path });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Sample app listening on port ${PORT}`);
  console.log(`Health check: http://0.0.0.0:${PORT}/health`);
});

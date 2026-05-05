#!/usr/bin/env node
/**
 * GitHub Pages companion utility for the cognitive test.
 *
 * Why this exists:
 * GitHub Pages cannot run server-side Node services, so this script is used at
 * build/setup time to generate static files consumed by the site.
 *
 * Commands:
 *   node server.js build-pages
 *   node server.js reset-results
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const USERS_PATH = path.join(ROOT, 'assets', 'cognitive-users.json');
const SETTINGS_PATH = path.join(ROOT, 'assets', 'cognitive-settings.json');
const RESULTS_PATH = path.join(ROOT, 'test-results.json');

const users = [
  ["test_user_01","mQ7!xN2p"],["test_user_02","L9@vK3ra"],["test_user_03","D4#sY8tm"],["test_user_04","P2$wH6zu"],["test_user_05","R8&nJ1qx"],
  ["test_user_06","B5!cT9ld"],["test_user_07","F1@pM7vk"],["test_user_08","Q3#hZ4rw"],["test_user_09","G6$yN2sb"],["test_user_10","T9&dK5xm"],
  ["test_user_11","V2!jR8pf"],["test_user_12","H7@uL3nc"],["test_user_13","N4#bW9qa"],["test_user_14","C1$zE6tg"],["test_user_15","Y5&kP2md"],
  ["test_user_16","J8!qS4vh"],["test_user_17","U3@fD7xr"],["test_user_18","M6#tA1kp"],["test_user_19","X9$gC5nw"],["test_user_20","K2&lB8ys"]
];

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function buildPages() {
  writeJson(USERS_PATH, { users });
  writeJson(SETTINGS_PATH, {
    mode: 'github-pages',
    resultsStorageKey: 'cognitive_test_results',
    generatedAt: new Date().toISOString()
  });

  if (!fs.existsSync(RESULTS_PATH)) writeJson(RESULTS_PATH, []);

  console.log('Generated GitHub Pages static config:');
  console.log(`- ${path.relative(ROOT, USERS_PATH)}`);
  console.log(`- ${path.relative(ROOT, SETTINGS_PATH)}`);
}

function resetResults() {
  writeJson(RESULTS_PATH, []);
  console.log(`Reset ${path.relative(ROOT, RESULTS_PATH)} to an empty array.`);
}

const command = process.argv[2];
if (command === 'build-pages') {
  buildPages();
} else if (command === 'reset-results') {
  resetResults();
} else {
  console.log('Usage: node server.js <build-pages|reset-results>');
  process.exitCode = 1;
}
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const RESULTS_PATH = path.join(ROOT, 'test-results.json');

const users = [
    ["test_user_01","mQ7!xN2p"],["test_user_02","L9@vK3ra"],["test_user_03","D4#sY8tm"],["test_user_04","P2$wH6zu"],["test_user_05","R8&nJ1qx"],
["test_user_06","B5!cT9ld"],["test_user_07","F1@pM7vk"],["test_user_08","Q3#hZ4rw"],["test_user_09","G6$yN2sb"],["test_user_10","T9&dK5xm"],
["test_user_11","V2!jR8pf"],["test_user_12","H7@uL3nc"],["test_user_13","N4#bW9qa"],["test_user_14","C1$zE6tg"],["test_user_15","Y5&kP2md"],
["test_user_16","J8!qS4vh"],["test_user_17","U3@fD7xr"],["test_user_18","M6#tA1kp"],["test_user_19","X9$gC5nw"],["test_user_20","K2&lB8ys"]
];
const credentials = Object.fromEntries(users);

function readResults() {
    if (!fs.existsSync(RESULTS_PATH)) return [];
    return JSON.parse(fs.readFileSync(RESULTS_PATH, 'utf8'));
}
function writeResults(results) {
    fs.writeFileSync(RESULTS_PATH, JSON.stringify(results, null, 2) + '\n', 'utf8');
}
function sendJson(res, status, data) {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
}
function parseBody(req) {
    return new Promise((resolve, reject) => {
        let raw = '';
        req.on('data', chunk => { raw += chunk; });
        req.on('end', () => {
            try { resolve(raw ? JSON.parse(raw) : {}); } catch (e) { reject(e); }
        });
        req.on('error', reject);
    });
}
function serveStatic(req, res) {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/') reqPath = '/index.html';
    const filePath = path.join(ROOT, path.normalize(reqPath));
    if (!filePath.startsWith(ROOT)) return sendJson(res, 403, { ok: false });
    fs.readFile(filePath, (err, data) => {
        if (err) return sendJson(res, 404, { ok: false, error: 'Not found' });
        const ext = path.extname(filePath);
        const types = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.png':'image/png', '.svg':'image/svg+xml', '.wav':'audio/wav' };
        res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
        res.end(data);
    });
}

const server = http.createServer(async (req, res) => {
    if (req.method === 'GET' && req.url.startsWith('/api/users')) return sendJson(res, 200, { users });

    if (req.method === 'POST' && req.url.startsWith('/api/login')) {
        try {
            const { username, password } = await parseBody(req);
            return sendJson(res, 200, { ok: Boolean(credentials[username] && credentials[username] === password) });
        } catch {
            return sendJson(res, 400, { ok: false, error: 'Invalid JSON' });
        }
    }

    if (req.method === 'POST' && req.url.startsWith('/api/submit-result')) {
        try {
            const payload = await parseBody(req);
            if (!credentials[payload.username]) return sendJson(res, 400, { ok: false, error: 'Unknown user' });
            const results = readResults();
            results.push({ ...payload, submittedAt: new Date().toISOString() });
            writeResults(results);
            return sendJson(res, 200, { ok: true });
        } catch {
            return sendJson(res, 400, { ok: false, error: 'Invalid JSON' });
        }
    }

    return serveStatic(req, res);
});

if (!fs.existsSync(RESULTS_PATH)) writeResults([]);
server.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));

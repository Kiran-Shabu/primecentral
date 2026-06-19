/**
 * Serves the static site and a small API for careers job openings.
 * Run: npm install && npm start
 * Admin panel: http://localhost:3000/admin.html
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const express = require("express");

const ROOT = __dirname;
const JOBS_FILE = path.join(ROOT, "data", "jobs.json");

/** Load .env into process.env (file values override existing env) */
function loadEnv() {
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, "utf8").replace(/^\uFEFF/, "");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}
loadEnv();

const PORT = Number(process.env.PORT) || 3000;
const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || "primecentral2026").trim();

const app = express();
app.use(express.json({ limit: "256kb" }));
app.use(express.static(ROOT));

const sessions = new Map();
const SESSION_MS = 8 * 60 * 60 * 1000;

function isPublished(job) {
  const p = job && job.published;
  if (p === false || p === 0 || p === "false" || p === "0") return false;
  return true;
}

function readJobsFile() {
  if (!fs.existsSync(JOBS_FILE)) {
    const empty = { jobs: [] };
    fs.mkdirSync(path.dirname(JOBS_FILE), { recursive: true });
    writeJobsFile(empty);
    return empty;
  }
  const raw = fs.readFileSync(JOBS_FILE, "utf8");
  const data = JSON.parse(raw);
  if (!Array.isArray(data.jobs)) throw new Error("Invalid jobs.json");
  return data;
}

function writeJobsFile(data) {
  fs.mkdirSync(path.dirname(JOBS_FILE), { recursive: true });
  fs.writeFileSync(JOBS_FILE, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function noCacheApi(_req, res, next) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  next();
}

function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function newId(title) {
  return slugify(title) + "-" + Date.now().toString(36);
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const session = sessions.get(token);
  if (!session || session.expires < Date.now()) {
    if (token) sessions.delete(token);
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

app.get("/api/jobs", noCacheApi, (req, res) => {
  try {
    const data = readJobsFile();
    const jobs = data.jobs
      .filter(isPublished)
      .sort((a, b) => (b.postedAt || "").localeCompare(a.postedAt || ""));
    res.json({ jobs });
  } catch (err) {
    console.error("GET /api/jobs:", err.message);
    res.status(500).json({ error: "Could not load jobs" });
  }
});

app.post("/api/admin/login", (req, res) => {
  const password = String((req.body || {}).password || "").trim();
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Invalid password" });
  }
  const token = crypto.randomBytes(24).toString("hex");
  sessions.set(token, { expires: Date.now() + SESSION_MS });
  res.json({ token, expiresIn: SESSION_MS });
});

app.post("/api/admin/logout", authMiddleware, (req, res) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  sessions.delete(token);
  res.json({ ok: true });
});

app.get("/api/admin/jobs", authMiddleware, (req, res) => {
  try {
    const data = readJobsFile();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Could not load jobs" });
  }
});

app.post("/api/admin/jobs", authMiddleware, (req, res) => {
  try {
    const data = readJobsFile();
    const body = req.body || {};
    const title = String(body.title || "").trim();
    if (!title) return res.status(400).json({ error: "Title is required" });

    const job = {
      id: body.id && String(body.id).trim() ? String(body.id).trim() : newId(title),
      title,
      department: String(body.department || "").trim(),
      location: String(body.location || "Abu Dhabi, UAE").trim(),
      type: String(body.type || "Full-time").trim(),
      summary: String(body.summary || "").trim(),
      description: String(body.description || "").trim(),
      requirements: Array.isArray(body.requirements)
        ? body.requirements.map((r) => String(r).trim()).filter(Boolean)
        : String(body.requirements || "")
            .split("\n")
            .map((r) => r.trim())
            .filter(Boolean),
      published: isPublished({ published: body.published }),
      postedAt: body.postedAt || new Date().toISOString().slice(0, 10),
    };

    if (data.jobs.some((j) => j.id === job.id)) {
      return res.status(409).json({ error: "A job with this ID already exists" });
    }

    data.jobs.unshift(job);
    writeJobsFile(data);
    res.status(201).json({ job });
  } catch (err) {
    res.status(500).json({ error: "Could not save job" });
  }
});

app.put("/api/admin/jobs/:id", authMiddleware, (req, res) => {
  try {
    const data = readJobsFile();
    const idx = data.jobs.findIndex((j) => j.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Job not found" });

    const existing = data.jobs[idx];
    const body = req.body || {};
    const title = String(body.title ?? existing.title).trim();
    if (!title) return res.status(400).json({ error: "Title is required" });

    data.jobs[idx] = {
      ...existing,
      title,
      department: String(body.department ?? existing.department).trim(),
      location: String(body.location ?? existing.location).trim(),
      type: String(body.type ?? existing.type).trim(),
      summary: String(body.summary ?? existing.summary).trim(),
      description: String(body.description ?? existing.description).trim(),
      requirements: body.requirements !== undefined
        ? Array.isArray(body.requirements)
          ? body.requirements.map((r) => String(r).trim()).filter(Boolean)
          : String(body.requirements)
              .split("\n")
              .map((r) => r.trim())
              .filter(Boolean)
        : existing.requirements,
      published:
        body.published !== undefined
          ? isPublished({ published: body.published })
          : isPublished(existing),
      postedAt: body.postedAt ?? existing.postedAt,
    };

    writeJobsFile(data);
    res.json({ job: data.jobs[idx] });
  } catch (err) {
    res.status(500).json({ error: "Could not update job" });
  }
});

app.delete("/api/admin/jobs/:id", authMiddleware, (req, res) => {
  try {
    const data = readJobsFile();
    const before = data.jobs.length;
    data.jobs = data.jobs.filter((j) => j.id !== req.params.id);
    if (data.jobs.length === before) {
      return res.status(404).json({ error: "Job not found" });
    }
    writeJobsFile(data);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Could not delete job" });
  }
});

const server = app.listen(PORT, () => {
  console.log(`Prime Central site: http://localhost:${PORT}`);
  console.log(`Admin panel:        http://localhost:${PORT}/admin.html`);
  if (ADMIN_PASSWORD === "primecentral2026") {
    console.log("Warning: using default admin password. Set ADMIN_PASSWORD in .env");
  }
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`\nError: Port ${PORT} is already in use.`);
    console.error("Another copy of the server may still be running.");
    console.error("\nFix options:");
    console.error("  1. Stop the other process, then run npm start again");
    console.error("  2. Use a different port in .env, e.g. PORT=3001\n");
    console.error("Windows — free port 3000:");
    console.error('  Get-NetTCPConnection -LocalPort 3000 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }\n');
    process.exit(1);
  }
  throw err;
});

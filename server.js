/**
 * Serves the static site and a small API for careers job openings.
 * Run: npm install && npm start
 * Admin panel: http://localhost:3000/admin.html
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const express = require("express");
const nodemailer = require("nodemailer");

const ROOT = __dirname;
// Job data bundled with the repo; used to seed the live store on first boot.
const SEED_JOBS_FILE = path.join(ROOT, "data", "jobs.json");

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

// Where job edits are persisted. On a host with an ephemeral filesystem
// (e.g. Render), set JOBS_FILE to a path on a persistent disk such as
// /data/jobs.json so admin changes survive restarts and deploys.
const JOBS_FILE = process.env.JOBS_FILE
  ? path.resolve(process.env.JOBS_FILE)
  : SEED_JOBS_FILE;

// ---------------------------------------------------------------------------
// Email (contact + quote forms)
// Configure via environment variables (set these in .env locally and in the
// Render dashboard in production):
//   SMTP_HOST      e.g. smtp.gmail.com
//   SMTP_PORT      e.g. 465 (SSL) or 587 (STARTTLS)
//   SMTP_SECURE    "true" for port 465, "false" for 587
//   SMTP_USER      the SMTP account username (usually the sending email)
//   SMTP_PASS      the SMTP password / app password
//   MAIL_TO        where enquiries are delivered (your inbox)
//   MAIL_FROM      the "from" address (defaults to SMTP_USER)
// ---------------------------------------------------------------------------
const MAIL = {
  host: (process.env.SMTP_HOST || "").trim(),
  port: Number(process.env.SMTP_PORT) || 587,
  secure: String(process.env.SMTP_SECURE || "").trim().toLowerCase() === "true",
  user: (process.env.SMTP_USER || "").trim(),
  pass: (process.env.SMTP_PASS || "").trim(),
  to: (process.env.MAIL_TO || process.env.SMTP_USER || "primecac@gmail.com").trim(),
  from: (process.env.MAIL_FROM || process.env.SMTP_USER || "").trim(),
};

let mailTransporter = null;
function getMailTransporter() {
  if (!MAIL.host || !MAIL.user || !MAIL.pass) return null;
  if (!mailTransporter) {
    mailTransporter = nodemailer.createTransport({
      host: MAIL.host,
      port: MAIL.port,
      secure: MAIL.secure,
      auth: { user: MAIL.user, pass: MAIL.pass },
    });
  }
  return mailTransporter;
}

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

/**
 * Ensure the live jobs store exists. On first boot against an empty
 * persistent disk, seed it from the repo's bundled data/jobs.json so the
 * site launches with the jobs committed to git instead of an empty list.
 */
function ensureJobsFile() {
  if (fs.existsSync(JOBS_FILE)) return;
  fs.mkdirSync(path.dirname(JOBS_FILE), { recursive: true });
  if (JOBS_FILE !== SEED_JOBS_FILE && fs.existsSync(SEED_JOBS_FILE)) {
    fs.copyFileSync(SEED_JOBS_FILE, JOBS_FILE);
    console.log("Seeded jobs store from", SEED_JOBS_FILE, "->", JOBS_FILE);
  } else {
    writeJobsFile({ jobs: [] });
  }
}

function readJobsFile() {
  ensureJobsFile();
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

function cleanField(value, max) {
  return String(value == null ? "" : value)
    .replace(/[\r\n]+/g, " ")
    .trim()
    .slice(0, max || 200);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeHtmlMail(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Build and send an enquiry email; returns a result object. */
async function sendEnquiryEmail({ subject, rows, replyTo, text }) {
  const transporter = getMailTransporter();
  if (!transporter) {
    return { ok: false, status: 503, error: "Email is not configured on the server yet." };
  }

  const tableRows = rows
    .filter((r) => r.value)
    .map(
      (r) =>
        `<tr><td style="padding:6px 12px;font-weight:600;color:#124e67;vertical-align:top;">${escapeHtmlMail(
          r.label
        )}</td><td style="padding:6px 12px;color:#1c2b35;">${escapeHtmlMail(r.value).replace(
          /\n/g,
          "<br>"
        )}</td></tr>`
    )
    .join("");

  const html = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:620px;margin:0 auto;">
    <div style="background:#124e67;color:#fff;padding:16px 20px;border-radius:8px 8px 0 0;">
      <h2 style="margin:0;font-size:18px;">${escapeHtmlMail(subject)}</h2>
      <p style="margin:4px 0 0;font-size:12px;opacity:.85;">Prime Central website enquiry</p>
    </div>
    <table style="width:100%;border-collapse:collapse;border:1px solid #dde3e8;border-top:none;">
      ${tableRows}
    </table>
    <p style="font-size:11px;color:#738fa0;margin:12px 4px;">Received ${new Date().toUTCString()}</p>
  </div>`;

  try {
    await transporter.sendMail({
      from: MAIL.from ? `"Prime Central Website" <${MAIL.from}>` : MAIL.user,
      to: MAIL.to,
      replyTo: replyTo && isValidEmail(replyTo) ? replyTo : undefined,
      subject,
      text,
      html,
    });
    return { ok: true };
  } catch (err) {
    console.error("sendMail error:", err.message);
    return { ok: false, status: 502, error: "Could not send your message. Please try again later." };
  }
}

// Hero "Request a Free Quote" form
app.post("/api/quote", noCacheApi, async (req, res) => {
  const body = req.body || {};
  // Honeypot: bots fill hidden fields; humans leave them empty.
  if (cleanField(body.company_website)) return res.json({ ok: true });

  const name = cleanField(body.name, 120);
  const email = cleanField(body.email, 160);
  const phone = cleanField(body.phone, 60);
  const service = cleanField(body.service, 120);

  if (!name || !email || !phone) {
    return res.status(400).json({ error: "Please provide your name, email and phone number." });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Please provide a valid email address." });
  }

  const rows = [
    { label: "Name", value: name },
    { label: "Email", value: email },
    { label: "Phone", value: phone },
    { label: "Service Required", value: service },
  ];
  const text = rows.filter((r) => r.value).map((r) => `${r.label}: ${r.value}`).join("\n");

  const result = await sendEnquiryEmail({
    subject: `Quote Request from ${name}`,
    rows,
    replyTo: email,
    text,
  });
  if (!result.ok) return res.status(result.status || 500).json({ error: result.error });
  res.json({ ok: true });
});

// Contact section "Send Enquiry" form
app.post("/api/contact", noCacheApi, async (req, res) => {
  const body = req.body || {};
  if (cleanField(body.company_website)) return res.json({ ok: true });

  const name = cleanField(body.name, 120);
  const company = cleanField(body.company, 160);
  const email = cleanField(body.email, 160);
  const phone = cleanField(body.phone, 60);
  const service = cleanField(body.service, 120);
  const message = cleanField(body.message, 4000);

  if (!name || !email) {
    return res.status(400).json({ error: "Please provide your name and email." });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Please provide a valid email address." });
  }

  const rows = [
    { label: "Name", value: name },
    { label: "Company", value: company },
    { label: "Email", value: email },
    { label: "Phone", value: phone },
    { label: "Service Required", value: service },
    { label: "Message", value: message },
  ];
  const text = rows.filter((r) => r.value).map((r) => `${r.label}: ${r.value}`).join("\n");

  const result = await sendEnquiryEmail({
    subject: `Contact Enquiry from ${name}`,
    rows,
    replyTo: email,
    text,
  });
  if (!result.ok) return res.status(result.status || 500).json({ error: result.error });
  res.json({ ok: true });
});

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
  try {
    ensureJobsFile();
  } catch (err) {
    console.error("Could not initialise jobs store:", err.message);
  }
  console.log(`Prime Central site: http://localhost:${PORT}`);
  console.log(`Admin panel:        http://localhost:${PORT}/admin.html`);
  console.log(`Jobs store:         ${JOBS_FILE}`);
  if (getMailTransporter()) {
    console.log(`Email enquiries:    enabled -> ${MAIL.to}`);
  } else {
    console.log("Email enquiries:    DISABLED (set SMTP_HOST, SMTP_USER, SMTP_PASS to enable)");
  }
  if (ADMIN_PASSWORD === "primecentral2026") {
    console.log(
      "Warning: using default admin password. Set a strong ADMIN_PASSWORD env var before going live."
    );
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

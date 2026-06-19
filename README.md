# Prime Central Air Conditioning — Website

Official marketing website for **Prime Central Air Conditioning Co. L.L.C** (Abu Dhabi, UAE). The site is a static front end with a small Node.js server for the **Careers** section and an **admin panel** to manage job openings without editing HTML.

---

## Table of contents

1. [Features](#features)
2. [Requirements](#requirements)
3. [Quick start](#quick-start)
4. [Project structure](#project-structure)
5. [Running the website](#running-the-website)
6. [Careers section](#careers-section)
7. [Admin panel](#admin-panel)
8. [API reference](#api-reference)
9. [Managing images](#managing-images)
10. [Rebuilding from source HTML](#rebuilding-from-source-html)
11. [Deployment](#deployment)
12. [Security](#security)
13. [Troubleshooting](#troubleshooting)

---

## Features

- Responsive single-page site: About, Services, Gallery, Industries, Process, Clients, Certifications, Contact
- **Director's Message** and **People & Infrastructure** blocks in the About section
- Image assets in `images/` (no huge embedded base64 in `index.html`)
- **Careers** section with live job listings from `data/jobs.json`
- **Admin panel** (`admin.html`) to add, edit, delete, and publish/unpublish openings
- CSS-only mobile menu and gallery lightbox (no JavaScript required for navigation/gallery)
- Optional build script to regenerate `index.html` from legacy source file

---

## Requirements

| Tool | Version |
|------|---------|
| [Node.js](https://nodejs.org/) | 18.x or newer recommended |
| npm | Comes with Node.js |

---

## Quick start

```bash
# 1. Go to the project folder
cd "d:\Stellar Stack Digital\primecentral"

# 2. Install dependencies (first time only)
npm install

# 3. (Recommended) Set admin password
copy .env.example .env
# Edit .env and set ADMIN_PASSWORD to a strong password

# 4. Start the server
npm start
```

Then open:

| URL | Purpose |
|-----|---------|
| http://localhost:3000 | Main website |
| http://localhost:3000/admin.html | Careers admin panel |

Default port is **3000**. Override with `PORT` in `.env`.

---

## Project structure

```
primecentral/
├── index.html              # Main website (generated/editable)
├── prime-central.css       # Stylesheet
├── server.js               # Express server + Careers API
├── package.json
├── .env.example            # Copy to .env for config
├── .gitignore
│
├── admin.html              # Job openings admin UI
├── admin.css
├── admin.js
│
├── js/
│   └── careers.js          # Loads jobs on the homepage
│
├── data/
│   └── jobs.json           # Job openings database (JSON file)
│
├── images/
│   ├── prime-logo.png      # Main site logo (Prime Services)
│   ├── logo.png            # Legacy; use prime-logo.png
│   ├── director.png
│   ├── careers-banner.jpg  # Careers section banner (add your file)
│   ├── gallery-1.jpg … gallery-5.jpg
│   └── …
│
├── build-site.js           # Rebuild index.html from legacy source
├── extract-images.js       # One-time: extract base64 images to images/
└── prime_central_website (9) (1).html   # Legacy single-file source (for build only)
```

---

## Running the website

### With the server (required for Careers)

```bash
npm start
```

This runs `node server.js`, which:

- Serves all static files (`index.html`, CSS, images, etc.)
- Exposes `/api/jobs` for the Careers section
- Exposes `/api/admin/*` for the admin panel

### Opening `index.html` directly

If you double-click `index.html` or open it as `file://`:

- Most of the site works (layout, gallery, contact form UI)
- **Careers job listings will not load** (browser blocks or cannot reach `/api/jobs`)
- **Admin panel will not work**

Always use **`npm start`** for full functionality.

---

## Careers section

- Section id: `#careers` (linked from main navigation)
- Layout: teal header panel, intro + banner on the left, job cards on the right
- Jobs are loaded by `js/careers.js` via `GET /api/jobs`
- Only jobs with `"published": true` appear on the public site
- **Apply Now** opens the user's email client with a pre-filled subject (to `primecac@gmail.com`)

### Careers banner image

Place your banner file at:

```
images/careers-banner.jpg
```

Supported: JPG/PNG. If the file is missing, a teal gradient placeholder is shown instead.

---

## Admin panel

### Access

1. Start the server: `npm start`
2. Open: **http://localhost:3000/admin.html**
3. Sign in with the admin password

### Default password (development only)

If you do not create a `.env` file, the default password is:

```
primecentral2026
```

**Change this before any public deployment.**

### What you can do

| Action | Description |
|--------|-------------|
| **Add opening** | Create a new job post |
| **Edit** | Update title, department, location, type, summary, description, requirements |
| **Delete** | Remove a job permanently |
| **Published** | When checked, the job appears on the website; when unchecked, it is hidden (draft) |

### Session

- Login returns a token stored in the browser (`sessionStorage`)
- Sessions expire after **8 hours**
- Use **Sign out** to end the session

### Set a secure password

1. Copy `.env.example` to `.env`:

   ```bash
   copy .env.example .env
   ```

2. Edit `.env`:

   ```env
   ADMIN_PASSWORD=YourStrongPasswordHere
   PORT=3000
   ```

3. Restart the server:

   ```bash
   npm start
   ```

---

## API reference

Base URL when running locally: `http://localhost:3000`

### Public

#### `GET /api/jobs`

Returns published jobs only, sorted by `postedAt` (newest first).

**Response:**

```json
{
  "jobs": [
    {
      "id": "hvac-technician-001",
      "title": "HVAC Technician",
      "department": "Operations",
      "location": "Abu Dhabi, UAE",
      "type": "Full-time",
      "summary": "Short one-line summary",
      "description": "Full job description",
      "requirements": ["Requirement 1", "Requirement 2"],
      "published": true,
      "postedAt": "2026-05-01"
    }
  ]
}
```

### Admin (requires `Authorization: Bearer <token>`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/admin/login` | Body: `{ "password": "..." }` → `{ "token", "expiresIn" }` |
| `POST` | `/api/admin/logout` | Invalidates current token |
| `GET` | `/api/admin/jobs` | All jobs (including drafts) |
| `POST` | `/api/admin/jobs` | Create job |
| `PUT` | `/api/admin/jobs/:id` | Update job |
| `DELETE` | `/api/admin/jobs/:id` | Delete job |

### Job object fields

| Field | Required | Description |
|-------|----------|-------------|
| `id` | Auto | Unique slug + timestamp; can be set on create |
| `title` | Yes | Job title |
| `department` | No | e.g. Operations, Projects |
| `location` | No | Default: Abu Dhabi, UAE |
| `type` | No | Full-time, Part-time, Contract, Internship |
| `summary` | No | Short line on the card |
| `description` | No | Full description |
| `requirements` | No | Array of strings (admin UI: one per line) |
| `published` | No | `true` = visible on site (default: true) |
| `postedAt` | No | Date `YYYY-MM-DD` |

### Example: create job with curl

```bash
# 1. Login
curl -s -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d "{\"password\":\"YOUR_PASSWORD\"}"

# 2. Use token from response
curl -X POST http://localhost:3000/api/admin/jobs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d "{\"title\":\"Site Supervisor\",\"department\":\"Operations\",\"published\":true}"
```

You can also edit `data/jobs.json` directly while the server is **stopped**, then restart.

---

## Managing images

All site images live in the **`images/`** folder.

| File | Used for |
|------|----------|
| `prime-logo.png` | Header, mobile menu, hero, footer, contact |
| `director.png` | Director's Message (About) |
| `careers-banner.jpg` | Careers section banner |
| `gallery-1.jpg` … `gallery-5.jpg` | Gallery grid and lightbox |

To replace an image: overwrite the file with the **same filename**, then refresh the browser (hard refresh: `Ctrl+F5`).

### Extract images from legacy HTML (one-time)

If you still have base64 images inside `prime_central_website (9) (1).html`:

```bash
node extract-images.js
```

This writes gallery and logo files into `images/`.

---

## Rebuilding from source HTML

The original site was a single large HTML file. `build-site.js` splits it into `index.html` + `prime-central.css` and applies modernisations (external images, gallery lightbox, About/Careers blocks).

```bash
npm run build
```

This:

- Reads `prime_central_website (9) (1).html`
- Writes `prime-central.css`
- Writes `index.html` (with About/Careers injections if not already present)
- Replaces embedded base64 images with `images/*` paths

**Note:** If you hand-edited `index.html`, running `npm run build` may overwrite some changes. Prefer editing `index.html` directly for small updates, or update `build-site.js` constants (`ABOUT_EXTRA_HTML`, `CAREERS_EXTRA_HTML`, `GALLERY`) for repeatable builds.

---

## Deployment

The site needs **both** static files and the **Node server** for Careers and admin.

### Option A: VPS / cloud VM (recommended)

1. Install Node.js on the server
2. Upload the project (exclude `node_modules`; run `npm install` on server)
3. Set `.env` with a strong `ADMIN_PASSWORD`
4. Run with a process manager, e.g. [PM2](https://pm2.keymetrics.io/):

   ```bash
   npm install -g pm2
   pm2 start server.js --name primecentral
   pm2 save
   ```

5. Put **Nginx** or **Caddy** in front as reverse proxy on port 80/443
6. Enable HTTPS (Let's Encrypt)

### Option B: Static hosting only

If you host on pure static hosting (GitHub Pages, S3, etc.):

- Upload `index.html`, `prime-central.css`, `images/`, `js/careers.js`
- Careers will **not** update dynamically unless you host the API elsewhere or switch to a serverless backend
- Admin panel will **not** work without the Node API

### Environment variables (production)

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: `3000`) |
| `ADMIN_PASSWORD` | Password for admin login (**required** in production) |

---

## Security

- **Never** commit `.env` to git (it is in `.gitignore`)
- **Never** use the default password `primecentral2026` on a live server
- Restrict access to `/admin.html` if possible (VPN, IP allowlist, or extra HTTP auth in Nginx)
- Back up `data/jobs.json` regularly
- Admin tokens are stored in server memory and expire after 8 hours

---

## Troubleshooting

### Careers section says jobs are unavailable

- Make sure you started the server: `npm start`
- Do not open the site as `file://`; use `http://localhost:3000`
- Check the browser console (F12) for failed requests to `/api/jobs`

### Admin login fails

- Confirm `.env` exists and `ADMIN_PASSWORD` matches what you type
- Restart the server after changing `.env`
- Clear browser session: close tab or clear site data for localhost

### Jobs not appearing after edit

- Ensure **Published** is checked in the admin form
- Refresh the main site (`Ctrl+F5`)
- Verify `data/jobs.json` contains the job and `"published": true`

### Images not showing

- Confirm files exist in `images/` with correct names
- Paths in HTML are relative: `images/prime-logo.png` (works when served from site root)
- For careers banner, add `images/careers-banner.jpg`

### Port already in use

```bash
# Use another port in .env
PORT=3001
```

Or stop the other process using port 3000.

---

## npm scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start Express server (`server.js`) |
| `npm run build` | Regenerate `index.html` and `prime-central.css` from legacy source |

---

## Contact (site content)

- **Office:** P.O Box 51492, Abu Dhabi, UAE  
- **Phone:** +971 2 672 4648 · +971 50 622 9175  
- **Email:** primecac@gmail.com · primeksuresh@gmail.com  
- **Web:** www.primegroupuae.ae  

---

## License

Private project for Prime Central Air Conditioning Co. L.L.C. All rights reserved.

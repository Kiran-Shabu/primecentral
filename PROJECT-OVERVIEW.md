# Prime Central — Website Project Overview

**Client:** Prime Central Air Conditioning Co. L.L.C (Abu Dhabi, UAE)
**Project Type:** Corporate / Business Website with Careers Management
**Prepared for:** Quotation & Scope Documentation

---

## 1. Project Summary

A modern, fully responsive corporate website for an electro-mechanical (HVAC / MEP / Facilities Management) contracting company, including a **public marketing website** and a **secure admin panel** for managing career/job postings. The site is backed by a lightweight Node.js server providing a careers API and content-management functionality.

---

## 2. Technology Stack

### Frontend
| Technology | Purpose |
|---|---|
| **HTML5** | Semantic markup and page structure |
| **CSS3** (hand-written, no framework) | Custom styling, layout, responsive design |
| CSS Grid & Flexbox | Modern responsive layouts |
| CSS Custom Properties (variables) | Theming and maintainable design system |
| `clamp()` / fluid typography | Scalable text across screen sizes |
| Media Queries | Mobile, tablet and desktop breakpoints |
| Inline SVG | Crisp, scalable icons (industries, UI) |
| **Vanilla JavaScript (ES6)** | All interactivity — no heavy frameworks |
| Google Fonts (Montserrat, Open Sans) | Professional typography |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js** | Server-side runtime |
| **Express.js** | Web server + REST API |
| **REST API (JSON)** | Careers data and admin operations |
| Token-based authentication | Secure admin login (Node `crypto`) |
| JSON flat-file storage | Job listings data store |
| Custom `.env` loader | Environment-based configuration |

### Tooling & Deployment
| Technology | Purpose |
|---|---|
| **npm** | Dependency & script management |
| **Git / GitHub** | Version control |
| **Render** (cloud hosting) | Production hosting (Node + persistent disk) |
| Auto SSL / Custom domain | Secure HTTPS on the client's domain |

> **Note:** The site uses **no paid frameworks or licenses** — only the open-source Express library. This keeps the stack lightweight, fast, secure, and low-maintenance.

---

## 3. Website Pages & Sections (Public Site)

A single-page, smooth-scrolling website with the following fully designed sections:

1. **Top Info Bar** — phone, email, ISO certifications
2. **Sticky Navigation Bar** — logo, company branding, menu, mobile drawer
3. **Hero Section** — company intro, logo, key stats, "25 Years of Excellence" badge, and a **Request a Quote** form
4. **About Us** — company profile + Director's Message (read more/less)
5. **People & Infrastructure** — company strengths
6. **Our Services** — auto-playing carousel of **15 services** with images
7. **Project Gallery** — image gallery with lightbox pop-up viewer
8. **Industries We Serve** — 6 sector cards with custom icons
9. **Our Process** — multi-phase workflow with timeline
10. **Our Clients** — animated logo marquee (15+ client logos)
11. **Certifications** — ISO and accreditation display
12. **Careers** — live job listings pulled from the server
13. **Contact** — contact details + enquiry form
14. **Footer** — branding, quick links, contact info

---

## 4. Key Functionalities & Features

### Public-Facing Features
- **Fully responsive design** — optimized for mobile, tablet, and desktop
- **Services carousel** — auto-advancing, infinite loop, swipeable on mobile, 4-at-a-time on desktop
- **Image gallery with lightbox** — click to view full-size with prev/next navigation
- **Animated client logo marquee** — continuous scrolling brand showcase
- **Director's message** — expandable read more / read less
- **Smooth-scroll navigation** with sticky header
- **Mobile navigation drawer** — hamburger menu for small screens
- **Request a Quote / Contact forms** — lead capture
- **Custom branding** — logos, anniversary badge, color system matched to brand
- **SEO-friendly structure** and fast load (no heavy frameworks)

### Careers Module (Dynamic)
- **Live job listings** loaded from the server via REST API
- **"View more / less"** toggle for the openings list
- **Published/unpublished** control (drafts hidden from public)
- **Apply by email** integration
- Graceful fallback if the server is unavailable

### Admin Panel (Secure, Password-Protected)
- **Secure login** with admin password + session token
- **Create** new job postings
- **Edit** existing job postings
- **Delete** job postings
- **Publish / unpublish** jobs (control public visibility)
- Manage job fields: title, department, location, type, summary, description, requirements, posting date
- **Session-based authentication** with auto-expiry (8 hours)
- Real-time success/error notifications (toasts)

### Backend / API
- `GET /api/jobs` — public list of published jobs
- `POST /api/admin/login` — admin authentication
- `POST /api/admin/logout` — end session
- `GET /api/admin/jobs` — full job list (admin)
- `POST /api/admin/jobs` — create job (admin)
- `PUT /api/admin/jobs/:id` — update job (admin)
- `DELETE /api/admin/jobs/:id` — delete job (admin)
- Static file serving for the entire website
- **Persistent data storage** with auto-seeding on first deployment

---

## 5. Design & Engineering Highlights

- **Custom UI/UX design** — no template; bespoke layout and brand-aligned visuals
- **Design system** — centralized color, typography, and spacing variables
- **Performance** — no bundler bloat, minimal dependencies, fast first paint
- **Accessibility considerations** — semantic HTML, ARIA labels, keyboard-friendly controls
- **Maintainability** — clean separation of HTML, CSS, and JS; modular scripts
- **Security** — token auth, input handling, environment-based secrets, gitignored credentials
- **Cross-browser & cross-device** tested responsive behavior

---

## 6. Deliverables

- Complete responsive corporate website (14 sections)
- Dynamic careers system (public listing + admin management)
- Secure admin content-management panel
- Node.js/Express backend with REST API
- Production deployment configuration (Render + persistent storage)
- Custom domain + SSL setup
- Source code with version control (GitHub)

---

## 7. Hosting & Maintenance (Ongoing)

- **Hosting:** Cloud platform (Render) running the Node.js application, always-on
- **Persistent storage** for careers data (survives restarts/deploys)
- **SSL certificate** (HTTPS) — auto-managed
- **Custom domain** connection
- Optional ongoing maintenance: content updates, new sections, feature additions, hosting management

---

## 8. Suggested Quotation Modules

For pricing breakdown, the project can be divided into the following billable modules:

| # | Module | Description |
|---|---|---|
| 1 | UI/UX Design | Custom layout, branding, responsive design system |
| 2 | Frontend Development | 14 fully built sections, carousels, gallery, animations |
| 3 | Responsive / Mobile Optimization | Mobile, tablet, desktop adaptation |
| 4 | Backend Development | Node.js/Express server + REST API |
| 5 | Careers Management System | Public listings + dynamic data |
| 6 | Admin Panel (CMS) | Secure login + full job CRUD management |
| 7 | Deployment & Hosting Setup | Cloud hosting, domain, SSL, persistence |
| 8 | Testing & QA | Cross-device/browser testing |
| 9 | (Optional) Maintenance & Support | Ongoing content/feature updates |

---

*This document describes the technologies and functionalities implemented in the Prime Central website project and is intended to support preparation of a project quotation.*

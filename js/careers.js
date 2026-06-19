(function () {
  const listEl = document.getElementById("careers-jobs-list");
  const emptyEl = document.getElementById("careers-empty");
  const countEl = document.getElementById("careers-jobs-count");
  const viewMoreBtn = document.getElementById("careers-view-more");
  if (!listEl) return;

  const INITIAL_VISIBLE = 2;
  const applyEmail = "primecac@gmail.com";
  const fetchOpts = { cache: "no-store", headers: { Accept: "application/json" } };

  let allJobs = [];
  let expanded = false;

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function isPublished(job) {
    const p = job && job.published;
    if (p === false || p === 0 || p === "false" || p === "0") return false;
    return true;
  }

  function sortJobs(jobs) {
    return jobs.slice().sort(function (a, b) {
      return (b.postedAt || "").localeCompare(a.postedAt || "");
    });
  }

  function applyMailto(job) {
    const subject = encodeURIComponent("Application: " + job.title);
    const body = encodeURIComponent(
      "Dear Prime Central HR,\n\nI would like to apply for the position: " +
        job.title +
        "\n\nName:\nPhone:\n\nThank you."
    );
    return "mailto:" + applyEmail + "?subject=" + subject + "&body=" + body;
  }

  function renderTags(job) {
    const tags = [];
    if (job.type) tags.push({ text: job.type, mod: "" });
    if (job.location) tags.push({ text: job.location, mod: "" });
    if (job.department) tags.push({ text: job.department, mod: "--dept" });
    if (!tags.length) return "";
    return (
      '<div class="careers-job__tags">' +
      tags
        .map(function (t) {
          return (
            '<span class="careers-job__tag' +
            (t.mod ? " careers-job__tag" + t.mod : "") +
            '">' +
            escapeHtml(t.text) +
            "</span>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  function renderJob(job, isExtra) {
    const reqs =
      job.requirements && job.requirements.length
        ? '<p class="careers-job__reqs-title">Key requirements</p>' +
          '<ul class="careers-job__reqs">' +
          job.requirements.map((r) => "<li>" + escapeHtml(r) + "</li>").join("") +
          "</ul>"
        : "";

    return (
      '<article class="careers-job fade-in' +
      (isExtra ? " careers-job--extra" : "") +
      '">' +
      '<div class="careers-job__top">' +
      "<div>" +
      '<h3 class="careers-job__title">' +
      escapeHtml(job.title) +
      "</h3>" +
      renderTags(job) +
      "</div>" +
      (job.postedAt
        ? '<time class="careers-job__date" datetime="' +
          escapeHtml(job.postedAt) +
          '">' +
          escapeHtml(job.postedAt) +
          "</time>"
        : "") +
      "</div>" +
      (job.summary ? '<p class="careers-job__summary">' + escapeHtml(job.summary) + "</p>" : "") +
      (job.description ? '<p class="careers-job__desc">' + escapeHtml(job.description) + "</p>" : "") +
      reqs +
      '<div class="careers-job__footer">' +
      '<a class="btn-careers careers-job__apply" href="' +
      applyMailto(job) +
      '">Apply now</a>' +
      "</div>" +
      "</article>"
    );
  }

  function updateCount(n) {
    if (!countEl) return;
    if (n > 0) {
      countEl.hidden = false;
      countEl.textContent = n + (n === 1 ? " role" : " roles");
    } else {
      countEl.hidden = true;
    }
  }

  function updateViewMoreButton() {
    if (!viewMoreBtn) return;
    const extra = allJobs.length - INITIAL_VISIBLE;
    if (extra <= 0) {
      viewMoreBtn.hidden = true;
      return;
    }
    viewMoreBtn.hidden = false;
    viewMoreBtn.setAttribute("aria-expanded", expanded ? "true" : "false");
    if (expanded) {
      viewMoreBtn.textContent = "View less";
    } else {
      viewMoreBtn.textContent =
        "View more (" + extra + " more opening" + (extra === 1 ? "" : "s") + ")";
    }
  }

  function renderJobList() {
    const jobsToShow = expanded ? allJobs : allJobs.slice(0, INITIAL_VISIBLE);
    listEl.innerHTML = jobsToShow
      .map(function (job, index) {
        return renderJob(job, expanded && index >= INITIAL_VISIBLE);
      })
      .join("");
    listEl.classList.toggle("careers-jobs-list--expanded", expanded);
    updateViewMoreButton();
  }

  function showEmpty(message) {
    allJobs = [];
    expanded = false;
    listEl.innerHTML = "";
    listEl.classList.remove("careers-jobs-list--expanded");
    updateCount(0);
    if (viewMoreBtn) viewMoreBtn.hidden = true;
    if (emptyEl) {
      emptyEl.hidden = false;
      const textEl = emptyEl.querySelector(".careers-empty__text");
      if (textEl && message) textEl.textContent = message;
    }
  }

  function showJobs(jobs) {
    if (emptyEl) emptyEl.hidden = true;
    allJobs = jobs;
    expanded = false;
    updateCount(jobs.length);
    renderJobList();
  }

  if (viewMoreBtn) {
    viewMoreBtn.addEventListener("click", function () {
      expanded = !expanded;
      renderJobList();
      if (expanded && viewMoreBtn) {
        viewMoreBtn.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    });
  }

  function parseJobsPayload(data) {
    const jobs = (data && data.jobs) || [];
    return sortJobs(jobs.filter(isPublished));
  }

  function fetchJson(url) {
    return fetch(url, fetchOpts).then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      const type = res.headers.get("content-type") || "";
      if (!type.includes("application/json")) throw new Error("Not JSON");
      return res.json();
    });
  }

  function loadJobs() {
    return fetchJson("/api/jobs")
      .then(parseJobsPayload)
      .catch(function () {
        return fetchJson("/data/jobs.json").then(parseJobsPayload);
      });
  }

  loadJobs()
    .then(function (jobs) {
      if (!jobs.length) {
        showEmpty(
          "There are no published openings at the moment. Check back soon or send your CV."
        );
        return;
      }
      showJobs(jobs);
    })
    .catch(function () {
      const origin = window.location.origin || "";
      const onFile = window.location.protocol === "file:";
      let msg =
        "Openings could not be loaded. View the site through the Node server (npm start) at http://localhost:3000 — not by opening index.html directly.";
      if (!onFile && origin && !origin.includes("localhost") && !origin.includes("127.0.0.1")) {
        msg =
          "Job listings need the Prime Central server running (npm start) on this host. Static hosting alone cannot load openings from the admin panel.";
      }
      showEmpty(msg);
    });
})();

(function () {
  const TOKEN_KEY = "primecentral_admin_token";

  const loginView = document.getElementById("login-view");
  const dashboardView = document.getElementById("dashboard-view");
  const loginForm = document.getElementById("login-form");
  const loginError = document.getElementById("login-error");
  const jobsList = document.getElementById("jobs-admin-list");
  const dialog = document.getElementById("job-dialog");
  const jobForm = document.getElementById("job-form");
  const dialogTitle = document.getElementById("dialog-title");
  const toast = document.getElementById("toast");

  let editingId = null;

  function token() {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  function setToken(t) {
    if (t) sessionStorage.setItem(TOKEN_KEY, t);
    else sessionStorage.removeItem(TOKEN_KEY);
  }

  function api(path, options) {
    options = options || {};
    const headers = Object.assign({ "Content-Type": "application/json" }, options.headers || {});
    if (token()) headers.Authorization = "Bearer " + token();
    return fetch(path, {
      method: options.method || "GET",
      headers: headers,
      body: options.body,
      cache: "no-store",
    }).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) throw new Error(data.error || "Request failed");
        return data;
      });
    });
  }

  function showToast(msg) {
    toast.textContent = msg;
    toast.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () {
      toast.hidden = true;
    }, 2800);
  }

  function showLogin() {
    loginView.hidden = false;
    dashboardView.hidden = true;
  }

  function showDashboard() {
    loginView.hidden = true;
    dashboardView.hidden = false;
    loadJobs();
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderAdminJob(job) {
    const card = document.createElement("div");
    card.className = "job-admin-card";
    card.innerHTML =
      "<div>" +
      "<h3>" +
      escapeHtml(job.title) +
      "</h3>" +
      "<p>" +
      [job.department, job.location, job.type].filter(Boolean).map(escapeHtml).join(" · ") +
      "</p>" +
      '<span class="badge ' +
      (job.published !== false ? "badge--live" : "badge--draft") +
      '">' +
      (job.published !== false ? "Published" : "Draft") +
      "</span>" +
      "</div>" +
      '<div class="job-admin-actions">' +
      '<button type="button" class="btn btn-ghost" data-edit="' +
      escapeHtml(job.id) +
      '">Edit</button>' +
      '<button type="button" class="btn btn-danger" data-delete="' +
      escapeHtml(job.id) +
      '">Delete</button>' +
      "</div>";
    return card;
  }

  function loadJobs() {
    api("/api/admin/jobs")
      .then(function (data) {
        jobsList.innerHTML = "";
        const jobs = data.jobs || [];
        if (!jobs.length) {
          jobsList.innerHTML = '<p style="color:#3a5060;font-size:14px;">No openings yet. Click “Add opening”.</p>';
          return;
        }
        jobs.forEach(function (job) {
          jobsList.appendChild(renderAdminJob(job));
        });
      })
      .catch(function (err) {
        if (err.message === "Unauthorized") {
          setToken(null);
          showLogin();
        } else {
          showToast(err.message);
        }
      });
  }

  function openDialog(job) {
    editingId = job ? job.id : null;
    dialogTitle.textContent = job ? "Edit job opening" : "Add job opening";
    document.getElementById("job-id-field").value = job ? job.id : "";
    document.getElementById("job-title").value = job ? job.title : "";
    document.getElementById("job-department").value = job ? job.department || "" : "";
    document.getElementById("job-location").value = job ? job.location || "Abu Dhabi, UAE" : "Abu Dhabi, UAE";
    document.getElementById("job-type").value = job ? job.type || "Full-time" : "Full-time";
    document.getElementById("job-posted").value = job ? job.postedAt || "" : new Date().toISOString().slice(0, 10);
    document.getElementById("job-summary").value = job ? job.summary || "" : "";
    document.getElementById("job-description").value = job ? job.description || "" : "";
    document.getElementById("job-requirements").value = job && job.requirements ? job.requirements.join("\n") : "";
    document.getElementById("job-published").checked = job ? job.published !== false : true;
    dialog.showModal();
  }

  function closeDialog() {
    dialog.close();
    editingId = null;
    jobForm.reset();
  }

  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    loginError.hidden = true;
    const password = document.getElementById("password").value;
    fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    })
      .then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok) throw new Error(data.error || "Login failed");
          return data;
        });
      })
      .then(function (data) {
        setToken(data.token);
        showDashboard();
      })
      .catch(function (err) {
        loginError.textContent = err.message;
        loginError.hidden = false;
      });
  });

  document.getElementById("btn-logout").addEventListener("click", function () {
    const t = token();
    if (t) {
      fetch("/api/admin/logout", {
        method: "POST",
        headers: { Authorization: "Bearer " + t },
      }).catch(function () {});
    }
    setToken(null);
    showLogin();
  });

  document.getElementById("btn-add-job").addEventListener("click", function () {
    openDialog(null);
  });

  document.getElementById("btn-cancel").addEventListener("click", closeDialog);

  jobForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const payload = {
      title: document.getElementById("job-title").value,
      department: document.getElementById("job-department").value,
      location: document.getElementById("job-location").value,
      type: document.getElementById("job-type").value,
      postedAt: document.getElementById("job-posted").value,
      summary: document.getElementById("job-summary").value,
      description: document.getElementById("job-description").value,
      requirements: document.getElementById("job-requirements").value,
      published: document.getElementById("job-published").checked,
    };

    const req = editingId
      ? api("/api/admin/jobs/" + encodeURIComponent(editingId), { method: "PUT", body: JSON.stringify(payload) })
      : api("/api/admin/jobs", { method: "POST", body: JSON.stringify(payload) });

    req
      .then(function () {
        closeDialog();
        loadJobs();
        if (payload.published) {
          showToast(
            (editingId ? "Opening updated" : "Opening added") +
              " — visible on site (refresh homepage)"
          );
        } else {
          showToast("Saved as draft — enable “Published” to show on the website");
        }
      })
      .catch(function (err) {
        showToast(err.message);
      });
  });

  jobsList.addEventListener("click", function (e) {
    const editBtn = e.target.closest("[data-edit]");
    const delBtn = e.target.closest("[data-delete]");
    if (editBtn) {
      api("/api/admin/jobs")
        .then(function (data) {
          const job = (data.jobs || []).find(function (j) {
            return j.id === editBtn.getAttribute("data-edit");
          });
          if (job) openDialog(job);
        })
        .catch(function (err) {
          showToast(err.message);
        });
    }
    if (delBtn) {
      const id = delBtn.getAttribute("data-delete");
      if (!confirm("Delete this job opening?")) return;
      api("/api/admin/jobs/" + encodeURIComponent(id), { method: "DELETE" })
        .then(function () {
          loadJobs();
          showToast("Opening deleted");
        })
        .catch(function (err) {
          showToast(err.message);
        });
    }
  });

  if (token()) showDashboard();
  else showLogin();
})();

(function () {
  function serialize(form) {
    var data = {};
    var elements = form.querySelectorAll("input, select, textarea");
    elements.forEach(function (el) {
      if (!el.name) return;
      data[el.name] = el.value;
    });
    return data;
  }

  function setStatus(statusEl, message, type) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.hidden = !message;
    statusEl.classList.remove("form-status--ok", "form-status--error");
    if (type) statusEl.classList.add("form-status--" + type);
  }

  function validate(form) {
    var required = form.querySelectorAll("[required]");
    for (var i = 0; i < required.length; i++) {
      if (!String(required[i].value || "").trim()) {
        required[i].focus();
        return "Please fill in all required fields.";
      }
    }
    var email = form.querySelector('input[type="email"]');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
      email.focus();
      return "Please enter a valid email address.";
    }
    return null;
  }

  function bind(formId, endpoint) {
    var form = document.getElementById(formId);
    if (!form) return;
    var button = form.querySelector('button[type="submit"]');
    var statusEl = form.querySelector(".form-status");
    var defaultText = button ? button.getAttribute("data-default-text") || button.innerHTML : "";

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var validationError = validate(form);
      if (validationError) {
        setStatus(statusEl, validationError, "error");
        return;
      }

      var payload = serialize(form);
      if (button) {
        button.disabled = true;
        button.innerHTML = "Sending\u2026";
      }
      setStatus(statusEl, "", null);

      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(function (res) {
          return res.json().then(function (data) {
            if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
            return data;
          });
        })
        .then(function () {
          form.reset();
          setStatus(
            statusEl,
            "Thank you! Your message has been sent. We'll get back to you shortly.",
            "ok"
          );
        })
        .catch(function (err) {
          setStatus(statusEl, err.message || "Could not send your message. Please try again.", "error");
        })
        .finally(function () {
          if (button) {
            button.disabled = false;
            button.innerHTML = defaultText;
          }
        });
    });
  }

  bind("quote-form", "/api/quote");
  bind("contact-form", "/api/contact");
})();

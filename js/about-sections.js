(function () {
  document.querySelectorAll("[data-read-more]").forEach(function (btn) {
    var targetId = btn.getAttribute("aria-controls");
    var target = targetId ? document.getElementById(targetId) : null;
    if (!target) return;

    var content = btn.closest(".director-showcase__content");

    btn.addEventListener("click", function () {
      var expanded = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", expanded ? "false" : "true");
      target.classList.toggle("is-expanded", !expanded);
      if (content) content.classList.toggle("is-message-expanded", !expanded);
      btn.textContent = expanded ? "Read more" : "Read less";
    });
  });
})();

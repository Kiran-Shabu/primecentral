(function () {
  var DEFAULT_AUTOPLAY_MS = 5000;
  var mqTablet = window.matchMedia("(max-width: 1024px)");
  var mqMobile = window.matchMedia("(max-width: 768px)");
  var mqReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function visibleCount() {
    if (mqMobile.matches) return 1;
    if (mqTablet.matches) return 2;
    return 4;
  }

  function initTrack(track) {
    var wrap = track.closest(".service-category");
    if (!wrap) return;

    var isAutoplay = track.hasAttribute("data-service-autoplay");
    var autoplayMs =
      parseInt(track.getAttribute("data-autoplay-interval"), 10) || DEFAULT_AUTOPLAY_MS;
    var nav = wrap.querySelector(".service-category__nav");
    var prev = wrap.querySelector("[data-carousel-prev]");
    var next = wrap.querySelector("[data-carousel-next]");
    var autoplayTimer = null;
    var scrollEndTimer = null;
    var paused = false;
    var loopPoint = 0;
    var isResetting = false;
    var scrollPending = false;

    function getRealCards() {
      return track.querySelectorAll(
        ".service-offer-card:not(.service-offer-card--clone)"
      );
    }

    function step() {
      var card = track.querySelector(".service-offer-card");
      if (!card) return 320;
      var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      return card.offsetWidth + gap;
    }

    function maxScroll() {
      return Math.max(0, track.scrollWidth - track.clientWidth);
    }

    function needsCarousel() {
      return getRealCards().length > visibleCount();
    }

    function removeClones() {
      track.querySelectorAll(".service-offer-card--clone").forEach(function (el) {
        el.remove();
      });
    }

    function buildInfiniteLoop() {
      removeClones();
      loopPoint = 0;
      var realCards = getRealCards();
      if (!isAutoplay || realCards.length <= visibleCount()) return;

      var count = visibleCount();
      var fragment = document.createDocumentFragment();
      for (var i = 0; i < count; i++) {
        var clone = realCards[i].cloneNode(true);
        clone.classList.add("service-offer-card--clone");
        clone.setAttribute("aria-hidden", "true");
        fragment.appendChild(clone);
      }
      track.appendChild(fragment);
      loopPoint = realCards.length * step();
    }

    function checkLoopReset() {
      if (!loopPoint || isResetting) return;
      if (track.scrollLeft >= loopPoint - 2) {
        isResetting = true;
        var target = track.scrollLeft - loopPoint;
        track.style.scrollSnapType = "none";
        track.style.scrollBehavior = "auto";
        track.scrollLeft = target;
        track.style.scrollBehavior = "";
        requestAnimationFrame(function () {
          track.style.scrollSnapType = "";
          isResetting = false;
          scrollPending = false;
        });
      } else {
        scrollPending = false;
      }
    }

    function onScrollEnd() {
      clearTimeout(scrollEndTimer);
      checkLoopReset();
    }

    function scheduleScrollEndCheck() {
      clearTimeout(scrollEndTimer);
      scrollEndTimer = setTimeout(onScrollEnd, 450);
    }

    function updateButtons() {
      if (!prev || !next) return;
      var max = maxScroll();
      var atStart = track.scrollLeft <= 2;
      var atEnd = track.scrollLeft >= max - 2;
      prev.disabled = atStart;
      next.disabled = atEnd;
      prev.setAttribute("aria-disabled", atStart ? "true" : "false");
      next.setAttribute("aria-disabled", atEnd ? "true" : "false");
    }

    function advanceAutoplay() {
      if (
        !needsCarousel() ||
        paused ||
        mqReducedMotion.matches ||
        isResetting ||
        scrollPending
      ) {
        return;
      }
      scrollPending = true;
      track.scrollBy({ left: step(), behavior: "smooth" });
      scheduleScrollEndCheck();
    }

    function stopAutoplay() {
      if (autoplayTimer) {
        clearInterval(autoplayTimer);
        autoplayTimer = null;
      }
    }

    function startAutoplay() {
      stopAutoplay();
      if (!isAutoplay || !needsCarousel() || mqReducedMotion.matches) return;
      autoplayTimer = setInterval(advanceAutoplay, autoplayMs);
    }

    function updateState() {
      if (isAutoplay) buildInfiniteLoop();
      var carousel = needsCarousel();
      wrap.classList.toggle("service-category--carousel", carousel);
      if (nav && !isAutoplay) nav.hidden = !carousel;
      if (!carousel) {
        track.scrollLeft = 0;
        removeClones();
        loopPoint = 0;
        stopAutoplay();
      } else if (isAutoplay) {
        if (track.scrollLeft >= loopPoint && loopPoint > 0) {
          track.scrollLeft = track.scrollLeft - loopPoint;
        }
        startAutoplay();
      }
      updateButtons();
    }

    if (prev) {
      prev.addEventListener("click", function () {
        track.scrollBy({ left: -step(), behavior: "smooth" });
      });
    }
    if (next) {
      next.addEventListener("click", function () {
        track.scrollBy({ left: step(), behavior: "smooth" });
      });
    }

    track.addEventListener(
      "scroll",
      function () {
        if (!isResetting) updateButtons();
      },
      { passive: true }
    );

    if ("onscrollend" in window) {
      track.addEventListener("scrollend", onScrollEnd);
    }

    if (isAutoplay) {
      wrap.addEventListener("mouseenter", function () {
        paused = true;
        stopAutoplay();
      });
      wrap.addEventListener("mouseleave", function () {
        paused = false;
        scrollPending = false;
        startAutoplay();
      });
      wrap.addEventListener("focusin", function () {
        paused = true;
        stopAutoplay();
      });
      wrap.addEventListener("focusout", function () {
        paused = false;
        scrollPending = false;
        startAutoplay();
      });
      document.addEventListener("visibilitychange", function () {
        if (document.hidden) {
          stopAutoplay();
        } else {
          startAutoplay();
        }
      });
      mqReducedMotion.addEventListener("change", updateState);
    }

    window.addEventListener("resize", function () {
      var offset = loopPoint > 0 ? track.scrollLeft % loopPoint : 0;
      updateState();
      if (loopPoint > 0 && offset > 0) {
        track.scrollLeft = Math.min(offset, maxScroll());
      }
      requestAnimationFrame(updateButtons);
    });

    requestAnimationFrame(updateState);
  }

  document.querySelectorAll("[data-service-carousel]").forEach(initTrack);
})();

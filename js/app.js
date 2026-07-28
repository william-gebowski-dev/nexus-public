(function () {
  "use strict";

  var root = document.documentElement;
  var THEME_KEY = "ecossistema-ia-theme";

  /* ---------- Tema (dark/light) ---------- */
  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    var btn = document.getElementById("theme-toggle");
    if (btn) btn.setAttribute("aria-label", theme === "dark" ? "Mudar para tema claro" : "Mudar para tema escuro");
  }

  function initTheme() {
    var saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
    var prefersLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
    var theme = saved || (prefersLight ? "light" : "dark");
    applyTheme(theme);

    var btn = document.getElementById("theme-toggle");
    if (btn) {
      btn.addEventListener("click", function () {
        var current = root.getAttribute("data-theme") === "light" ? "light" : "dark";
        var next = current === "dark" ? "light" : "dark";
        applyTheme(next);
        try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
      });
    }
  }

  /* ---------- Índice: destaque da seção ativa via scroll ---------- */
  function initActiveToc() {
    var links = Array.prototype.slice.call(document.querySelectorAll(".toc a[href^='#']"));
    if (!links.length) return;
    var targets = links
      .map(function (a) {
        var id = a.getAttribute("href").slice(1);
        var el = document.getElementById(id);
        return el ? { link: a, el: el } : null;
      })
      .filter(Boolean);
    if (!targets.length) return;

    var activeLink = null;
    function setActive(link) {
      if (activeLink === link) return;
      if (activeLink) activeLink.classList.remove("active");
      link.classList.add("active");
      activeLink = link;
      if (link.scrollIntoViewIfNeeded) {
        // no-op fallback; scrollIntoView below covers real browsers
      }
      var sidebar = document.querySelector(".toc");
      if (sidebar) {
        var linkRect = link.getBoundingClientRect();
        var boxRect = sidebar.getBoundingClientRect();
        if (linkRect.top < boxRect.top || linkRect.bottom > boxRect.bottom) {
          link.scrollIntoView({ block: "nearest" });
        }
      }
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var match = targets.find(function (t) { return t.el === entry.target; });
            if (match) setActive(match.link);
          }
        });
      },
      { rootMargin: "-15% 0px -70% 0px", threshold: 0 }
    );

    targets.forEach(function (t) { observer.observe(t.el); });
  }

  /* ---------- Busca no índice ---------- */
  function initTocSearch() {
    var input = document.getElementById("toc-search");
    if (!input) return;
    var items = Array.prototype.slice.call(document.querySelectorAll(".toc li"));

    input.addEventListener("input", function () {
      var q = input.value.trim().toLowerCase();
      items.forEach(function (li) {
        var text = li.textContent.toLowerCase();
        li.classList.toggle("hidden", q.length > 0 && text.indexOf(q) === -1);
      });
    });
  }

  /* ---------- Botão "voltar ao topo" ---------- */
  function initTopButton() {
    var btn = document.getElementById("top-btn");
    if (!btn) return;
    window.addEventListener(
      "scroll",
      function () {
        btn.classList.toggle("visible", window.scrollY > 600);
      },
      { passive: true }
    );
    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initTheme();
    initActiveToc();
    initTocSearch();
    initTopButton();
  });
})();

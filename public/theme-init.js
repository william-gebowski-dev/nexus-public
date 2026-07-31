// Aplicação inicial do tema antes do React montar — evita o flash (FOUC).
// Lê o tema persistido em localStorage e define o atributo data-theme
// correspondente no <html>. O CSP bloqueia scripts inline; este arquivo
// é carregado normalmente via <script src="..."> e fica fora do
// bloqueio.
(function () {
  try {
    var stored = window.localStorage.getItem("nexus-theme");
    if (stored && stored !== "auto") {
      document.documentElement.setAttribute("data-theme", stored);
    }
  } catch (e) {
    /* sem localStorage, mantém o tema default definido no HTML */
  }
})();

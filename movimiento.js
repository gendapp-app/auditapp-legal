/* Movimiento suave: las tarjetas suben un poco al entrar en pantalla y el teléfono y las burbujas
   se desplazan apenas al bajar. Nada de esto corre con "reducir movimiento". */
(function () {
  document.querySelectorAll(".pagina details, .pagina section, .pagina .intro, .pagina nav.toc, .pagina .pasos li").forEach(function (el) { el.setAttribute("data-aparece", ""); });
  if (!window.matchMedia || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var root = document.documentElement;
  if ("IntersectionObserver" in window) {
    root.classList.add("mueve");
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("visto"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    document.querySelectorAll("[data-aparece]").forEach(function (el) { io.observe(el); });
  }
  // El desplazamiento al bajar solo en pantallas anchas: en el celular la escena va debajo del texto
  // y una burbuja que sube lo taparía.
  var capas = document.querySelectorAll("[data-paralaje]"), pedido = false, ancha = matchMedia("(min-width: 900px)");
  function mover() {
    pedido = false;
    var y = ancha.matches ? Math.min(window.scrollY, 700) : 0;
    capas.forEach(function (el) { el.style.translate = "0 " + (y * parseFloat(el.dataset.paralaje)).toFixed(1) + "px"; });
  }
  window.addEventListener("scroll", function () { if (!pedido) { pedido = true; requestAnimationFrame(mover); } }, { passive: true });
})();

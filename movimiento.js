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

/* Carrusel de la portada: pasa solo cada 5,5 s, se pausa con el mouse encima, con el foco adentro o al
   tocarlo (vuelve a pasar solo 10 s después del último toque), se desliza con el dedo (deslizamiento del
   navegador) y se arrastra con el mouse, con puntitos abajo. Solo pasa solo si se ve en pantalla y la
   pestaña está a la vista; con "reducir movimiento" no pasa solo y cambia sin animación. */
(function () {
  var carrusel = document.querySelector(".carrusel");
  if (!carrusel) return;
  var pista = carrusel.querySelector(".pistas"), diapos = pista.children, n = diapos.length, puntos = carrusel.querySelector(".puntos");
  if (n < 2) return;
  var quieto = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  var actual = 0, encima = false, enfocado = false, aLaVista = true, pausaHasta = 0, arrastre = null, pedido = false, yendoHasta = 0;

  for (var i = 0; i < n; i++) {
    var boton = document.createElement("button");
    boton.type = "button";
    boton.setAttribute("aria-label", "Ver la pantalla " + (i + 1) + " de " + n);
    boton.addEventListener("click", (function (k) { return function () { tocado(); ir(k); }; })(i));
    puntos.appendChild(boton);
  }
  puntos.hidden = false;

  // Distancia entre una pantalla y la siguiente (su ancho más el espacio entre las dos).
  function ancho() { return (diapos[1].offsetLeft - diapos[0].offsetLeft) || 1; }
  // Al pasar solo, con un puntito o con el mouse, la pantalla nueva se marca enseguida y se ignoran los
  // eventos del deslizamiento en camino (si no, el puntito parpadea por las pantallas intermedias).
  function ir(k) {
    marcar(k);
    yendoHasta = Date.now() + 900;
    pista.scrollTo({ left: k * ancho(), behavior: quieto ? "auto" : "smooth" });
  }
  function marcar(k) {
    actual = k;
    for (var i = 0; i < n; i++) {
      puntos.children[i].setAttribute("aria-current", i === k ? "true" : "false");
      diapos[i].setAttribute("aria-hidden", i === k ? "false" : "true");
    }
  }
  function tocado() { pausaHasta = Date.now() + 10000; }
  marcar(0);

  pista.addEventListener("scroll", function () {
    if (pedido || Date.now() < yendoHasta) return;
    pedido = true;
    requestAnimationFrame(function () {
      pedido = false;
      var k = Math.max(0, Math.min(n - 1, Math.round(pista.scrollLeft / ancho())));
      if (k !== actual) marcar(k);
    });
  }, { passive: true });

  carrusel.addEventListener("mouseenter", function () { encima = true; });
  carrusel.addEventListener("mouseleave", function () { encima = false; });
  // Solo pausa el foco puesto con el teclado: el de un clic en un puntito no la frena para siempre.
  carrusel.addEventListener("focusin", function (e) { enfocado = !!(e.target.matches && e.target.matches(":focus-visible")); });
  carrusel.addEventListener("focusout", function () { enfocado = false; });
  pista.addEventListener("touchstart", tocado, { passive: true });
  // Que un clic o un toque no enfoque la fila: el navegador desplazaría la página para mostrarla entera
  // y el título quedaría debajo de la barra.
  pista.addEventListener("mousedown", function (e) { if (e.button === 0) e.preventDefault(); });
  carrusel.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") { e.preventDefault(); tocado(); ir(Math.min(n - 1, actual + 1)); }
    if (e.key === "ArrowLeft") { e.preventDefault(); tocado(); ir(Math.max(0, actual - 1)); }
  });

  // Arrastre con el mouse (con el dedo ya desliza el navegador).
  pista.addEventListener("dragstart", function (e) { e.preventDefault(); });
  pista.addEventListener("pointerdown", function (e) {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    arrastre = { x: e.clientX, izquierda: pista.scrollLeft, desde: actual, movio: false };
    pista.setPointerCapture(e.pointerId);
    pista.classList.add("arrastrando");
  });
  pista.addEventListener("pointermove", function (e) {
    if (!arrastre) return;
    var dx = e.clientX - arrastre.x;
    if (Math.abs(dx) > 4) arrastre.movio = true;
    pista.scrollLeft = arrastre.izquierda - dx;
  });
  function soltar(e) {
    if (!arrastre) return;
    var dx = e.clientX - arrastre.x, k = arrastre.desde;
    if (dx < -40) k = Math.min(n - 1, k + 1);
    else if (dx > 40) k = Math.max(0, k - 1);
    arrastre = null;
    tocado();
    ir(k);
    setTimeout(function () { pista.classList.remove("arrastrando"); }, 450);
  }
  pista.addEventListener("pointerup", soltar);
  pista.addEventListener("pointercancel", soltar);

  window.addEventListener("resize", function () { pista.scrollLeft = actual * ancho(); });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) { aLaVista = es[0].isIntersecting; }, { threshold: 0.4 }).observe(carrusel);
  }
  if (!quieto) {
    setInterval(function () {
      if (encima || enfocado || arrastre || !aLaVista || document.hidden || Date.now() < pausaHasta) return;
      ir((actual + 1) % n);
    }, 5500);
  }
})();

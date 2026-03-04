(function () {
  var script = document.currentScript;
  var tenantKey = script.getAttribute("data-key");
  if (!tenantKey) return console.error("Support widget: tenant key missing");

  var ORIGIN = "https://widget-one-beryl.vercel.app";

  var iframe = document.createElement("iframe");
  iframe.id = "cw-iframe";
  iframe.src = ORIGIN + "/embed/widget?key=" + encodeURIComponent(tenantKey);

  iframe.style.position = "fixed";
  iframe.style.inset = "0";
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.style.border = "none";
  iframe.style.zIndex = "2147483647";
  iframe.style.background = "transparent";
  iframe.style.pointerEvents = "none"; // start click-through

  var activator = document.createElement("div");
  activator.id = "cw-activator";
  activator.style.position = "fixed";
  activator.style.right = "16px";
  activator.style.bottom = "16px";
  activator.style.width = "80px";
  activator.style.height = "80px";
  activator.style.zIndex = "2147483648"; // ensure ABOVE iframe
  activator.style.cursor = "pointer";
  activator.style.background = "transparent";

  function openWidget() {
    // allow clicks inside iframe
    iframe.style.pointerEvents = "auto";

    // IMPORTANT: stop blocking clicks
    activator.style.pointerEvents = "none"; // (or activator.style.display = "none")

    // tell widget to open (requires listener inside widget)
    iframe.contentWindow &&
      iframe.contentWindow.postMessage({ type: "CW_OPEN" }, ORIGIN);
  }

  function closeWidget() {
    iframe.style.pointerEvents = "none";
    activator.style.pointerEvents = "auto";
  }

  activator.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    openWidget();
  });

  window.addEventListener("message", function (e) {
    if (e.origin !== ORIGIN) return;
    if (e.data && e.data.type === "CW_CLOSE") closeWidget();
  });

  document.body.appendChild(iframe);
  document.body.appendChild(activator);
})();
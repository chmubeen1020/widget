(function () {
  var script = document.currentScript;
  var tenantKey = script && script.getAttribute("data-key");

  if (!tenantKey) {
    console.error("Support widget: tenant key missing (data-key)");
    return;
  }

  // Prevent double-inject
  if (document.getElementById("cw-iframe")) return;

  var iframe = document.createElement("iframe");
  iframe.id = "cw-iframe";

  iframe.src =
    "https://widget-one-beryl.vercel.app/embed/widget?key=" +
    encodeURIComponent(tenantKey);

  // Full page overlay, but transparent
  iframe.style.position = "fixed";
  iframe.style.inset = "0";               // top/left/right/bottom = 0
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.style.border = "none";
  iframe.style.zIndex = "2147483647";
  iframe.style.background = "transparent";

  // IMPORTANT: don't block page clicks when widget is closed.
  // Your widget can later postMessage to toggle this, but for now:
  iframe.style.pointerEvents = "none";

  document.body.appendChild(iframe);

  // OPTIONAL (better UX): allow clicks only when user interacts with widget area
  // For now, simplest: enable pointer events after user presses a key combo:
  window.addEventListener("keydown", function (e) {
    if (e.altKey && e.key.toLowerCase() === "c") {
      iframe.style.pointerEvents =
        iframe.style.pointerEvents === "none" ? "auto" : "none";
      console.log("[Widget] pointerEvents:", iframe.style.pointerEvents);
    }
  });
})();
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
  iframe.style.pointerEvents = "none"; // ✅ Start with clicks passing through

  // ✅ Listen for messages from widget
  window.addEventListener("message", function (e) {
    if (e.origin !== ORIGIN) return;

    // When modal opens, enable pointer events
    if (e.data && e.data.type === "CW_MODAL_OPEN") {
      iframe.style.pointerEvents = "auto";
    }

    // When modal closes, disable pointer events
    if (e.data && e.data.type === "CW_MODAL_CLOSE") {
      iframe.style.pointerEvents = "none";
    }
  });

  document.body.appendChild(iframe);
})();
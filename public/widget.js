(function () {
  var script = document.currentScript;
  var tenantKey = script.getAttribute("data-key");
  if (!tenantKey) return console.error("Support widget: tenant key missing");

  var ORIGIN = "https://widget-one-beryl.vercel.app";

  // iframe (initially click-through)
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

  // activator button area (always clickable)
  var activator = document.createElement("div");
  activator.id = "cw-activator";
  activator.style.position = "fixed";
  activator.style.right = "16px";
  activator.style.bottom = "16px";
  activator.style.width = "80px";
  activator.style.height = "80px";
  activator.style.zIndex = "2147483647";
  activator.style.cursor = "pointer";
  activator.style.background = "transparent";

  // Toggle interactions
  activator.addEventListener("click", function () {
    iframe.style.pointerEvents = "auto"; // allow clicks inside widget
    // tell widget "open"
    iframe.contentWindow &&
      iframe.contentWindow.postMessage({ type: "CW_OPEN" }, ORIGIN);
  });

  // Allow widget to tell host "close" (so iframe becomes click-through again)
  window.addEventListener("message", function (e) {
    if (e.origin !== ORIGIN) return;
    if (e.data && e.data.type === "CW_CLOSE") {
      iframe.style.pointerEvents = "none";
    }
  });

  document.body.appendChild(iframe);
  document.body.appendChild(activator);
})();
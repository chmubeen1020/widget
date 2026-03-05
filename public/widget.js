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
  iframe.style.pointerEvents = "none";

  // Create invisible overlay that becomes active when modal is open
  var overlay = document.createElement("div");
  overlay.id = "cw-overlay";
  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.zIndex = "2147483646"; // Just below iframe
  overlay.style.background = "transparent";
  overlay.style.pointerEvents = "none";
  overlay.style.display = "none";

  window.addEventListener("message", function (e) {
    if (e.origin !== ORIGIN) return;

    if (e.data && e.data.type === "CW_MODAL_OPEN") {
      // Enable full iframe interaction
      iframe.style.pointerEvents = "auto";
      overlay.style.display = "block";
      overlay.style.pointerEvents = "auto";
    }

    if (e.data && e.data.type === "CW_MODAL_CLOSE") {
      // Disable iframe interaction except for FAB area
      iframe.style.pointerEvents = "none";
      overlay.style.display = "none";
      overlay.style.pointerEvents = "none";
    }

    // NEW: Handle FAB zone clicks
    if (e.data && e.data.type === "CW_FAB_ZONE") {
      var position = e.data.position || "bottom_right";
      var size = e.data.size || { width: 80, height: 80 };
      
      // Create a clickable zone for the FAB
      var fabZone = document.getElementById("cw-fab-zone");
      if (!fabZone) {
        fabZone = document.createElement("div");
        fabZone.id = "cw-fab-zone";
        fabZone.style.position = "fixed";
        fabZone.style.zIndex = "2147483648"; // Above iframe
        fabZone.style.pointerEvents = "auto";
        document.body.appendChild(fabZone);
      }

      // Position the FAB zone
      fabZone.style.width = size.width + "px";
      fabZone.style.height = size.height + "px";
      
      if (position.includes("bottom")) fabZone.style.bottom = "24px";
      if (position.includes("top")) fabZone.style.top = "24px";
      if (position.includes("right")) fabZone.style.right = "24px";
      if (position.includes("left")) fabZone.style.left = "24px";

      // Forward clicks to iframe
      fabZone.onclick = function(event) {
        iframe.contentWindow.postMessage({ type: "CW_FAB_CLICK" }, ORIGIN);
      };
    }
  });

  document.body.appendChild(overlay);
  document.body.appendChild(iframe);
})();
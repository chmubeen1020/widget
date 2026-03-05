(function () {
  var script = document.currentScript;
  var tenantKey = script.getAttribute("data-key");
  if (!tenantKey) return console.error("Support widget: tenant key missing");

  var ORIGIN = "https://widget-one-beryl.vercel.app";

  // FAB iframe (always visible, always clickable)
  var fabIframe = document.createElement("iframe");
  fabIframe.id = "cw-fab-iframe";
  fabIframe.src = ORIGIN + "/embed/fab?key=" + encodeURIComponent(tenantKey);
  fabIframe.style.position = "fixed";
  fabIframe.style.bottom = "24px";
  fabIframe.style.right = "24px";
  fabIframe.style.width = "80px";
  fabIframe.style.height = "80px";
  fabIframe.style.border = "none";
  fabIframe.style.zIndex = "2147483647";
  fabIframe.style.background = "transparent";
  fabIframe.style.pointerEvents = "auto"; // Always clickable

  // Modal iframe (shown/hidden)
  var modalIframe = document.createElement("iframe");
  modalIframe.id = "cw-modal-iframe";
  modalIframe.src = ORIGIN + "/embed/modal?key=" + encodeURIComponent(tenantKey);
  modalIframe.style.position = "fixed";
  modalIframe.style.inset = "0";
  modalIframe.style.width = "100%";
  modalIframe.style.height = "100%";
  modalIframe.style.border = "none";
  modalIframe.style.zIndex = "2147483647";
  modalIframe.style.background = "transparent";
  modalIframe.style.pointerEvents = "none";
  modalIframe.style.display = "none";

  // Listen for messages
  window.addEventListener("message", function (e) {
    if (e.origin !== ORIGIN) return;

    if (e.data && e.data.type === "CW_OPEN_MODAL") {
      modalIframe.style.display = "block";
      modalIframe.style.pointerEvents = "auto";
    }

    if (e.data && e.data.type === "CW_CLOSE_MODAL") {
      modalIframe.style.display = "none";
      modalIframe.style.pointerEvents = "none";
    }
  });

  document.body.appendChild(fabIframe);
  document.body.appendChild(modalIframe);
})();
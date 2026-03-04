(function () {
  var script = document.currentScript;
  var tenantKey = script && script.getAttribute("data-key");
  if (!tenantKey) return console.error("Support widget: tenant key missing");

  if (document.getElementById("cw-iframe")) return;

  var iframe = document.createElement("iframe");
  iframe.id = "cw-iframe";
  iframe.src =
    "https://widget-one-beryl.vercel.app/embed/widget?key=" +
    encodeURIComponent(tenantKey);

  iframe.style.position = "fixed";
  iframe.style.inset = "0";
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.style.border = "none";
  iframe.style.zIndex = "2147483647";
  iframe.style.background = "transparent";
  iframe.style.pointerEvents = "none"; // don't block host page by default

  document.body.appendChild(iframe);

  var activator = document.createElement("div");
  activator.id = "cw-activator";
  activator.style.position = "fixed";
  activator.style.right = "16px";
  activator.style.bottom = "16px";
  activator.style.width = "80px";
  activator.style.height = "80px";
  activator.style.zIndex = "2147483648"; // ✅ must be ABOVE iframe
  activator.style.cursor = "pointer";
  activator.style.background = "transparent";

  activator.addEventListener("click", function () {
    iframe.style.pointerEvents = "auto"; // ✅ allow clicking widget
  });

  document.body.appendChild(activator);

  // Optional: click outside widget area to return to click-through mode
  document.addEventListener("click", function (e) {
    // if click was NOT on activator, and NOT inside iframe (we can't detect inside),
    // you can choose to keep it enabled or disable. For now we keep enabled.
  });
})();
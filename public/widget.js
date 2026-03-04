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
  iframe.style.pointerEvents = "none"; // default: don't block host page

  document.body.appendChild(iframe);

  // Small clickable area in bottom-right to "activate" the iframe
  var activator = document.createElement("div");
  activator.id = "cw-activator";
  activator.style.position = "fixed";
  activator.style.right = "24px";
  activator.style.bottom = "24px";
  activator.style.width = "64px";
  activator.style.height = "64px";
  activator.style.zIndex = "2147483648";
  activator.style.cursor = "pointer";
  activator.style.background = "transparent";

  activator.addEventListener("click", function () {
    iframe.style.pointerEvents = "auto"; // allow click inside widget
    // optional: auto-disable after a bit if user doesn't open it
    setTimeout(function () {
      iframe.style.pointerEvents = "none";
    }, 1500);
  });

  document.body.appendChild(activator);

  // Later we can make this perfect using postMessage (open/close)
})();
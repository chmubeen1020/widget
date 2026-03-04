(function () {
  var script = document.currentScript;
  var tenantKey = script.getAttribute("data-key");

  if (!tenantKey) {
    console.error("Support widget: tenant key missing");
    return;
  }

  var iframe = document.createElement("iframe");

  iframe.src =
    "https://widget-one-beryl.vercel.app/embed/widget?key=" +
    encodeURIComponent(tenantKey);

  iframe.style.position = "fixed";
  iframe.style.bottom = "0";
  iframe.style.right = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";
  iframe.style.zIndex = "999999";
  iframe.style.background = "transparent";

  document.body.appendChild(iframe);
})();
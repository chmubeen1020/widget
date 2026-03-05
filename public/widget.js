(function () {
  var script = document.currentScript;
  var tenantKey = script.getAttribute("data-key");
  if (!tenantKey) return console.error("Support widget: tenant key missing");

  var ORIGIN = "https://widget-one-beryl.vercel.app"; // Ensure this matches the widget's URL

  // Create the iframe
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
  iframe.style.pointerEvents = "none"; // Start in a non-clickable state

  // Create the activator button
  var activator = document.createElement("div");
  activator.id = "cw-activator";
  activator.style.position = "fixed";
  activator.style.right = "16px";
  activator.style.bottom = "16px";
  activator.style.width = "80px";
  activator.style.height = "80px";
  activator.style.zIndex = "2147483648"; // Ensure it's above iframe
  activator.style.cursor = "pointer";
  activator.style.background = "transparent";
  
  // Open the widget (enable iframe pointer events)
  function openWidget() {
    iframe.style.pointerEvents = "auto"; // Allow clicks inside iframe
    activator.style.display = "none"; // Hide the activator button after click
    iframe.contentWindow &&
      iframe.contentWindow.postMessage({ type: "CW_OPEN" }, ORIGIN); // Notify iframe to open
  }

  // Close the widget (disable iframe pointer events)
  function closeWidget() {
    iframe.style.pointerEvents = "none";
    activator.style.display = "block"; // Show the activator button again
  }

  // Handle activator button click
  activator.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    openWidget(); // Open the widget when clicked
  });

  // Listen for close message from iframe
  window.addEventListener("message", function (e) {
    if (e.origin !== ORIGIN) return; // Ignore messages from other origins
    if (e.data && e.data.type === "CW_CLOSE") closeWidget(); // Close widget when notified
  });

  // Append iframe and activator to the document body
  document.body.appendChild(iframe);
  document.body.appendChild(activator);
})();
(function () {
  var script = document.currentScript;
  var tenantKey = script.getAttribute("data-key");
  if (!tenantKey) return console.error("Support widget: tenant key missing");

  var ORIGIN = "https://widget-one-beryl.vercel.app";

  // Create iframe
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

  // Create visible chat button
  var activator = document.createElement("div");
  activator.id = "cw-activator";
  activator.style.position = "fixed";
  activator.style.right = "24px";
  activator.style.bottom = "24px";
  activator.style.width = "60px";
  activator.style.height = "60px";
  activator.style.borderRadius = "50%";
  activator.style.background = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
  activator.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
  activator.style.cursor = "pointer";
  activator.style.zIndex = "2147483647"; // Same as iframe
  activator.style.display = "flex";
  activator.style.alignItems = "center";
  activator.style.justifyContent = "center";
  activator.style.transition = "transform 0.2s, box-shadow 0.2s";
  
  // Add chat icon SVG
  activator.innerHTML = `
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  `;

  // Hover effect
  activator.addEventListener("mouseenter", function() {
    activator.style.transform = "scale(1.1)";
    activator.style.boxShadow = "0 6px 20px rgba(0,0,0,0.2)";
  });
  
  activator.addEventListener("mouseleave", function() {
    activator.style.transform = "scale(1)";
    activator.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
  });

  function openWidget() {
    iframe.style.pointerEvents = "auto";
    activator.style.display = "none"; // Hide the button when widget is open
    iframe.contentWindow && iframe.contentWindow.postMessage({ type: "CW_OPEN" }, ORIGIN);
  }

  function closeWidget() {
    iframe.style.pointerEvents = "none";
    activator.style.display = "flex"; // Show the button again
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
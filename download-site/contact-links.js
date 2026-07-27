(function () {
  var chatUrl = "mailto:support@prevleakgroup.company?subject=Website%20chat%20request";
  var whatsappUrl = "https://wa.me/?text=Hello%20PrevLeak%20Group%2C%20I%20need%20help%20with%20your%20websites%20and%20apps.";

  var style = document.createElement("style");
  style.textContent = ""
    + ".contact-links-widget{position:fixed;right:14px;bottom:14px;z-index:9999;display:flex;flex-direction:column;gap:10px}"
    + ".contact-links-widget a{font-family:Segoe UI,Arial,sans-serif;text-decoration:none;color:#fff;padding:10px 14px;border-radius:999px;font-weight:700;box-shadow:0 6px 18px rgba(0,0,0,.16)}"
    + ".contact-links-chat{background:#1f4d80}"
    + ".contact-links-whatsapp{background:#1f9f58}"
    + "@media (max-width:640px){.contact-links-widget{right:10px;bottom:10px}.contact-links-widget a{padding:9px 12px;font-size:13px}}";
  document.head.appendChild(style);

  var wrap = document.createElement("div");
  wrap.className = "contact-links-widget";

  var chat = document.createElement("a");
  chat.className = "contact-links-chat";
  chat.href = chatUrl;
  chat.textContent = "Chat";
  chat.setAttribute("aria-label", "Open chat contact link");

  var wa = document.createElement("a");
  wa.className = "contact-links-whatsapp";
  wa.href = whatsappUrl;
  wa.target = "_blank";
  wa.rel = "noopener noreferrer";
  wa.textContent = "WhatsApp";
  wa.setAttribute("aria-label", "Open WhatsApp contact link");

  wrap.appendChild(chat);
  wrap.appendChild(wa);
  document.body.appendChild(wrap);
})();

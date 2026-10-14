// Tiny Python highlighter for the implementation page (comments, strings, keywords, numbers, calls).
(function () {
  "use strict";
  const KEYWORDS = new Set(("def return if not else elif for in import from as with async await " +
    "None True False and or is lambda class try except raise while pass yield").split(" "));
  const TOKEN = /("""[\s\S]*?"""|f?"(?:\\.|[^"\\\n])*"|f?'(?:\\.|[^'\\\n])*')|(#[^\n]*)|\b(\d+(?:\.\d+)?(?:e-?\d+)?)\b|\b([A-Za-z_]\w*)\b(\s*\()?/g;
  const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  function highlight(src) {
    let out = "", last = 0, m;
    TOKEN.lastIndex = 0;
    while ((m = TOKEN.exec(src))) {
      out += esc(src.slice(last, m.index));
      if (m[1]) out += '<span class="tok-str">' + esc(m[1]) + "</span>";
      else if (m[2]) out += '<span class="tok-com">' + esc(m[2]) + "</span>";
      else if (m[3]) out += '<span class="tok-num">' + m[3] + "</span>";
      else if (KEYWORDS.has(m[4])) out += '<span class="tok-kw">' + m[4] + "</span>" + (m[5] || "");
      else if (m[5]) out += '<span class="tok-fn">' + m[4] + "</span>" + m[5];
      else out += m[4];
      last = TOKEN.lastIndex;
    }
    return out + esc(src.slice(last));
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("code.language-python").forEach(function (el) {
      el.innerHTML = highlight(el.textContent);
    });
  });
})();

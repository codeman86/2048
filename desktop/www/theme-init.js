try {
  var stored = localStorage.getItem("theme");
  if (stored === "light" || stored === "dark") {
    document.documentElement.setAttribute("data-theme", stored);
  }
} catch (err) {}

var night = document.documentElement.getAttribute("data-theme") !== "light";
var meta = document.querySelector('meta[name="theme-color"]');
if (meta) meta.setAttribute("content", night ? "#141614" : "#f4f1ea");

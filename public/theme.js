// Apply dark mode before rendering
const isDarkMode = localStorage.getItem("dark-mode") === "true";
if (isDarkMode) {
  document.documentElement.classList.add("dark-mode");
  const darkModeStyles = document.getElementById("dark-mode-styles");
  if (darkModeStyles) darkModeStyles.disabled = false;
}

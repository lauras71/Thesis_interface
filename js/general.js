const DEFAULT_SETTINGS = {
    fontSize: 18,
    fontStyle: "Arial",
    theme:"default",
    contrast: 50
};

function loadSettings() {
    const saved = localStorage.getItem("settings");
    return saved ? JSON.parse(saved) : { ...DEFAULT_SETTINGS };
}
  
function saveSettings() {
    localStorage.setItem("settings", JSON.stringify(settings));
}

let settings = loadSettings();

window.addEventListener("DOMContentLoaded", () => {
  
    applyTheme(settings.theme);
    applySize(settings.fontSize);
    applyContrast(settings.contrast);
    applyStyle(settings.fontStyle);

});


function applyContrast(value) {
    const contrastValue = 0.7 + (value / 100) * 0.7;
    document.documentElement.style.setProperty(
      "--contrast",
      contrastValue
    );
}

function applyTheme(themeName) {

    const t = themes[themeName];
    const root = document.documentElement;
  
    Object.entries(t).forEach(([key, value]) => {
  
      if (key === "clusters") return;
  
      root.style.setProperty(key, value);
  
    });
  
    window.clusterColors = t.clusters;
}

function applySize(size) {
    document.documentElement.style.setProperty("--font-size", settings.fontSize + "px");
}

function applyStyle (font) {
    document.documentElement.style.setProperty("--font-family", font);
    const preview = document.getElementById("font-style-preview");
    if (preview) {
        preview.style.fontFamily = font;
    }
}





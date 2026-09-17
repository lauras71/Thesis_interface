/*--------------------
      SIDEBAR 
---------------------*/
const links = document.querySelectorAll(".sidebar a[href^='#']");

window.addEventListener("DOMContentLoaded", () => {
  document.querySelector('.sidebar a[href="#font"]')?.classList.add("active");
});

links.forEach(link => {
  link.addEventListener("click", (e) => {

    const id = link.getAttribute("href");
    const target = document.querySelector(id);

    if (!target) return;

    // ACTIVE sidebar immediato
    links.forEach(l => l.classList.remove("active"));
    link.classList.add("active");

    // POP sempre
    target.classList.remove("focus-pop");
    void target.offsetWidth;
    target.classList.add("focus-pop");

    if (id === "#feature") {
      e.preventDefault();
      target.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    } else {
      e.preventDefault();
    }
  });
});

let manualActive = null;
const observer = new IntersectionObserver((entries) => {

if (manualActive && manualActive !== "#feature") return;

let best = null;
let bestRatio = 0;

entries.forEach(entry => {
  if (entry.intersectionRatio > bestRatio) {
    bestRatio = entry.intersectionRatio;
    best = entry;
  }
});

if (!best) return;

const id = best.target.id;

links.forEach(link => {
  link.classList.remove("active");

  if (link.getAttribute("href") === "#" + id) {
    link.classList.add("active");
  }
});

}, {
threshold: [0.3, 0.5, 0.7, 0.9]
});

window.addEventListener("scroll", () => {
  manualActive = null;
});


/*--------------------
      SETTINGS
---------------------*/
let initialSettings = null;
const MIN_FONT = 15;
const MAX_FONT = 21;

function applySettings() {
  // FONT SIZE
  document.getElementById("font-value").textContent =
    settings.fontSize + "px";

  document.getElementById("font-preview").style.fontSize =
    settings.fontSize * 1.3 + "px";

  document.documentElement.style.setProperty(
    "--font-size",
    settings.fontSize + "px"
  );
}

document.querySelectorAll(".font-option").forEach(el => {
    el.addEventListener("click", () => {

        document.querySelectorAll(".font-option")
            .forEach(x => x.classList.remove("active"));

        el.classList.add("active");

        const selectedFont = el.dataset.font;

        settings.fontStyle = selectedFont;
        applyStyle(selectedFont);
        applySettings();
    });
});


document.getElementById("font-increase").addEventListener("click", () => {
  if (settings.fontSize < MAX_FONT) {
    settings.fontSize++;
    applySettings();
  }
});
document.getElementById("font-decrease").addEventListener("click", () => {
  if (settings.fontSize > MIN_FONT) {
    settings.fontSize--;
    applySettings();
  }
});
document.getElementById("size-reset").addEventListener("click", () => {
  settings.fontSize = DEFAULT_SETTINGS.fontSize;
  applySettings();
});

document.getElementById("style-reset").addEventListener("click", () => {

    settings.fontStyle = DEFAULT_SETTINGS.fontStyle;

    applyStyle(settings.fontStyle);

    document.querySelectorAll(".font-option")
        .forEach(el => {
            el.classList.toggle(
                "active",
                el.dataset.font === settings.fontStyle
            );
    });

console.log("BEFORE SAVE:", settings);
saveSettings();
console.log("AFTER SAVE:", JSON.parse(localStorage.getItem("settings")));
      
       
});

document.getElementById("color-reset")
  .addEventListener("click", () => {

    settings.theme = DEFAULT_SETTINGS.theme;

    applyTheme(settings.theme);

    document.querySelectorAll(".palette")
      .forEach(el => {
        el.classList.toggle(
          "active",
          el.dataset.theme === settings.theme
        );
      });

});

document.getElementById("save-btn").addEventListener("click", () => {
  saveSettings();
  initialSettings = {
    fontSize: settings.fontSize,
    fontStyle: settings.fontStyle,
    theme: settings.theme,
    contrast: settings.contrast
  };
  showToast();
});

document.getElementById("discard-btn").addEventListener("click", () => {
  settings.fontSize = initialSettings.fontSize;
    settings.fontStyle = initialSettings.fontStyle;
    settings.theme = initialSettings.theme;
    settings.contrast = initialSettings.contrast;

    applySettings();
    applyTheme(settings.theme);
    applyStyle(settings.fontStyle);
    updateContrastUI();

    document.querySelectorAll(".palette").forEach(el => {
        el.classList.toggle(
            "active",
            el.dataset.theme === settings.theme
        );
    });

    document.querySelectorAll(".font-option").forEach(el => {
        el.classList.toggle(
            "active",
            el.dataset.font === settings.fontStyle
        );
    });

    showToast1();
});

window.addEventListener("DOMContentLoaded", () => {
  settings = loadSettings(); 
  initialSettings = {
    fontSize: settings.fontSize,
    fontStyle: settings.fontStyle,
    theme: settings.theme,
    contrast: settings.contrast
  };  
  applySettings();   
  applyTheme(settings.theme);
  updateContrastUI();
  
  
  document.querySelectorAll(".palette").forEach(el => {
    el.classList.toggle(
      "active",
      el.dataset.theme === settings.theme
    );
  });

  document.querySelectorAll(".font-option").forEach(el => {
    el.classList.toggle(
      "active",
      el.dataset.font === settings.fontStyle
    );
  });
  
  document.getElementById("font-style-preview").style.fontFamily =
    settings.fontStyle;
});


const slider = document.getElementById("contrast-slider");
slider.addEventListener("input", () => {

  settings.contrast = Number(slider.value);

  applyContrast(settings.contrast); 
  saveSettings();

});

function updateContrastUI() {

  slider.value = settings.contrast;
  applyContrast(settings.contrast);

}

document.getElementById("contrast-reset").addEventListener("click", () => {

  settings.contrast = DEFAULT_SETTINGS.contrast;
  updateContrastUI();

});



/*--------------------
      SAVE BANNER
---------------------*/
const toast = document.getElementById("save-toast");
const toastDiscard = document.getElementById("save-toast1");

function showToast() {
  toast.style.opacity = "1";
  toast.style.transform = "translateX(-50%) translateY(0)";

  clearTimeout(toast._timeout);

  toast._timeout = setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(-50%) translateY(-6px)";
  }, 1800);
}

function showToast1() {
  toastDiscard.style.opacity = "1";
  toastDiscard.style.transform = "translateX(-50%) translateY(0)";

  clearTimeout(toastDiscard._timeout);

  toastDiscard._timeout = setTimeout(() => {
    toastDiscard.style.opacity = "0";
    toastDiscard.style.transform = "translateX(-50%) translateY(-6px)";
  }, 1800);
}



// palette selection
document.querySelectorAll(".palette").forEach(p => {

  p.addEventListener("click", () => {

    document.querySelectorAll(".palette")
      .forEach(x => x.classList.remove("active"));

    p.classList.add("active");

    const selectedTheme = p.dataset.theme;

    applyTheme(selectedTheme);

    settings.theme = selectedTheme;
  });

});





    

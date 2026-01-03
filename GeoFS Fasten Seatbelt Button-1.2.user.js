// ==UserScript==
// @name         GeoFS Fasten Seatbelt Button
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Adds a Fasten Seatbelt sign button next to Autopilot (independent of Autopilot visibility)
// @author       ChristianPilotAlex003
// @match        https://www.geo-fs.com/*
// @match        https://play.geofs.com/*
// @match        https://*.geo-fs.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  if (window.__geofsSeatbeltFinal) return;
  window.__geofsSeatbeltFinal = true;

  // =======================
  // AUDIO
  // =======================
  const SOUND_URL =
    "https://raw.githubusercontent.com/ChristianPilotAlex003/GeoFS-Seatbelt-Sign-Sound/main/670297__kinoton__airplane-seatbelt-sign-beep.mp3";

  const audio = new Audio(SOUND_URL);
  audio.volume = 0.75;

  function playChime() {
    audio.pause();
    audio.currentTime = 0;
    setTimeout(() => audio.play().catch(() => {}), 100);
  }

  // =======================
  // FIND AUTOPILOT
  // =======================
  function findAutopilot() {
    return (
      document.querySelector('[title="Autopilot"]') ||
      document.querySelector('[aria-label="Autopilot"]') ||
      [...document.querySelectorAll("button, div")]
        .find(el => el.innerText?.trim().toUpperCase() === "AUTOPILOT") ||
      null
    );
  }

  // =======================
  // CREATE BUTTON
  // =======================
  function createSeatbeltButton() {
    const btn = document.createElement("div");
    btn.id = "geofs-seatbelt-btn";
    btn.textContent = "SEATBELT";

    Object.assign(btn.style, {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",

      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "14px",
      fontWeight: "400",
      color: "#ffffff",

      borderRadius: "16px",
      cursor: "pointer",
      userSelect: "none",

      /* spacing from autopilot */
      marginRight: "11.4px",

      /* transparent look */
      background: "linear-gradient(#d89a9a, #b76b6b)",
      border: "1px solid #9c5e5e",
      opacity: "0.85",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",

      transition: "background 0.15s ease, border 0.15s ease, opacity 0.1s ease",
      boxSizing: "border-box",
      pointerEvents: "auto",
      zIndex: 2147483647
    });

    btn.dataset.state = "off";

    btn.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const isOn = btn.dataset.state === "on";
      btn.dataset.state = isOn ? "off" : "on";

      btn.style.background = isOn
        ? "linear-gradient(#d89a9a, #b76b6b)"
        : "linear-gradient(#9fd9a2, #6fbf73)";
      btn.style.border = isOn
        ? "1px solid #9c5e5e"
        : "1px solid #5e9c63";

      playChime();
      console.log("Fasten Seatbelt:", !isOn);
    }, true);

    return btn;
  }

  // =======================
  // INSERT NEXT TO AUTOPILOT
  // =======================
  let seatbeltBtn = null;

  function insertButton(ap) {
    if (!ap || !ap.parentElement) return false;
    if (document.getElementById("geofs-seatbelt-btn")) return true;

    seatbeltBtn = createSeatbeltButton();
    ap.parentElement.insertBefore(seatbeltBtn, ap);

    // Keep size synced to Autopilot
    const ro = new ResizeObserver(() => {
      seatbeltBtn.style.width = ap.offsetWidth + "px";
      seatbeltBtn.style.height = ap.offsetHeight + "px";
    });
    ro.observe(ap);

    return true;
  }

  // =======================
  // "." KEY — SEATBELT ONLY
  // =======================
  let seatbeltVisible = true;

  document.addEventListener("keydown", (e) => {
    if (e.key !== ".") return;

    seatbeltVisible = !seatbeltVisible;
    if (seatbeltBtn) {
      seatbeltBtn.style.display = seatbeltVisible ? "inline-flex" : "none";
    }
  }, false); // IMPORTANT: bubble phase → does NOT interfere with GeoFS

  // =======================
  // WAIT FOR UI
  // =======================
  const wait = setInterval(() => {
    const ap = findAutopilot();
    if (ap && ap.offsetWidth > 0) {
      clearInterval(wait);
      insertButton(ap);
      console.log("Fasten Seatbelt button loaded (Autopilot untouched)");
    }
  }, 300);

})();
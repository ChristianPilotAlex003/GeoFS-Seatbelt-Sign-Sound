// ==UserScript==
// @name         GeoFS Fasten Seatbelt Button
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Adds a realistic fasten seatbelt sign button with authentic cabin chime.
// @author       Christian Pilot Alex 003 (CPA003)
// @match        https://www.geo-fs.com/*
// @match        https://play.geofs.com/*
// @match        https://*.geo-fs.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  // Prevent double injection
  if (window.__geofsSeatbeltStable) return;
  window.__geofsSeatbeltStable = true;

  // =======================
  // AUDIO
  // =======================
  const SOUND =
    "https://cdn.jsdelivr.net/gh/ChristianPilotAlex003/GeoFS-Seatbelt-Sign-Sound/670297__kinoton__airplane-seatbelt-sign-beep.mp3";

  const audio = new Audio(SOUND);
  audio.volume = 0.75;

  function playChime() {
    audio.pause();
    audio.currentTime = 0;
    setTimeout(() => audio.play().catch(() => {}), 120);
  }

  // =======================
  // FIND AUTOPILOT BUTTON
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
  // CREATE SEATBELT BUTTON
  // =======================
  function makeButton() {
    const btn = document.createElement("div");
    btn.id = "geofs-seatbelt-btn";
    btn.innerText = "SEATBELT";

    Object.assign(btn.style, {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "14px",
      fontWeight: "400",
      color: "#ffffff",
      borderThickness: "4px",
      borderRadius: "16px",
      cursor: "pointer",
      userSelect: "none",

      // THIS IS THE SPACING CONTROL
      marginRight: "11.4px", // ← increased from 6px

      background: "linear-gradient(#d89a9a, #b76b6b)",
      border: "1px solid #9c5e5e",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
      transition: "background 0.15s ease, border 0.15s ease",
      boxSizing: "border-box",
      pointerEvents: "auto",
      zIndex: 2147483647
    });

    btn.dataset.seatbelt = "off";

    btn.addEventListener(
      "mousedown",
      (e) => {
        e.preventDefault();
        e.stopPropagation();

        const on = btn.dataset.seatbelt === "on";
        btn.dataset.seatbelt = on ? "off" : "on";

        btn.style.background = on
          ? "linear-gradient(#d89a9a, #b76b6b)"
          : "linear-gradient(#9fd9a2, #6fbf73)";
        btn.style.border = on
          ? "1px solid #9c5e5e"
          : "1px solid #5e9c63";

        playChime();
        console.log("Fasten Seatbelts:", !on);
      },
      true // capture phase
    );

    return btn;
  }

  // =======================
  // INSERT LEFT OF AUTOPILOT (Update 1.2)
  // =======================
  function insertSeatbelt(ap) {
    if (!ap || !ap.parentElement) return false;
    if (document.getElementById("geofs-seatbelt-btn")) return true;

    const btn = makeButton();
    const parent = ap.parentElement;

    // Insert BEFORE autopilot (left in LTR layouts)
    parent.insertBefore(btn, ap);

    // Handle flex layouts(Update 1.2)
    try {
      const parentStyle = getComputedStyle(parent);
      if (parentStyle.display.includes("flex")) {
        const apOrder = parseInt(getComputedStyle(ap).order || "0", 10);
        btn.style.order = isNaN(apOrder) ? apOrder : apOrder - 1;
      }
    } catch {}

    // Keep size synced
    const ro = new ResizeObserver(() => {
      btn.style.width = ap.offsetWidth + "px";
      btn.style.height = ap.offsetHeight + "px";
    });
    ro.observe(ap);

    return true;
  }

  // =======================
  // WAIT FOR UI
  // =======================
  const wait = setInterval(() => {
    const ap = findAutopilot();
    if (ap && ap.offsetWidth > 0) {
      clearInterval(wait);
      insertSeatbelt(ap);
      console.log("Fasten Seatbelt switch loaded (spacing adjusted)");
    }
  }, 300);

})();
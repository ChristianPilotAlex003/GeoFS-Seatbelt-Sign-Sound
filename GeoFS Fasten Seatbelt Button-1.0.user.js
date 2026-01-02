// ==UserScript==
// @name         GeoFS Fasten Seatbelt Button
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Adds a seatbelt sign sound replicating the one the is heard throughout the cabins of all aircraft, used as a signal for passengers to fasten their seatbelts.
// @author       Christian Pilot Alex 003(CPA003)
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

  const SOUND = "https://cdn.jsdelivr.net/gh/ChristianPilotAlex003/GeoFS-Seatbelt-Sign-Sound/670297__kinoton__airplane-seatbelt-sign-beep.mp3";
  const audio = new Audio(SOUND);
  audio.volume = 0.75;

  function playChime() {
    audio.pause();
    audio.currentTime = 0;
    audio.play().catch(err => console.warn("Audio blocked or error:", err));
  }

  function findAutopilot() {
    return document.querySelector('[title="Autopilot"]') ||
           document.querySelector('[aria-label="Autopilot"]') ||
           [...document.querySelectorAll("button,div")].find(el => el.innerText?.trim().toUpperCase() === "AUTOPILOT") ||
           null;
  }
  function findPushback() {
    return document.querySelector('[title="Pushback"]') ||
           document.querySelector('[aria-label="Pushback"]') ||
           [...document.querySelectorAll("button,div")].find(el => el.innerText?.trim().toUpperCase() === "PUSHBACK") ||
           null;
  }

  function makeButton() {
    const btn = document.createElement("div");
    btn.id = "geofs-seatbelt-btn";
    btn.innerText = "SEATBELT";
    Object.assign(btn.style, {
      display: "inline-block",
      padding: "0 10px",
      height: "27px",
      lineHeight: "34px",
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "14px",
      fontWeight: "600",
      color: "#fff",
      borderRadius: "4px",
      cursor: "pointer",
      userSelect: "none",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
      transition: "all 0.12s ease",
      background: "linear-gradient(#d89a9a, #b76b6b)",
      border: "1px solid #9c5e5e",
      zIndex: 2147483647,
      pointerEvents: "auto",
      boxSizing: "border-box",
      textAlign: "center",
      verticalAlign: "middle"
    });
    btn.dataset.__seatbeltOn = "0";
    btn.addEventListener("click", () => {
      const on = btn.dataset.__seatbeltOn === "1";
      btn.dataset.__seatbeltOn = on ? "0" : "1";
      btn.style.background = on ? "linear-gradient(#d89a9a, #b76b6b)" : "linear-gradient(#9fd9a2, #6fbf73)";
      btn.style.border = on ? "1px solid #9c5e5e" : "1px solid #5e9c63";
      playChime();
      console.log("Fasten Seatbelts Toggled :", !on);
    }, { capture: true });
    return btn;
  }

  function insertLeftOf(ap, pb) {
    if (!ap || !ap.parentElement) return false;
    // avoid duplicates
    if (document.getElementById("geofs-seatbelt-btn")) return true;

    const btn = makeButton();

    // Insert in DOM before autopilot (so it should be left in normal LTR flow)
    ap.parentElement.insertBefore(btn, ap);

    // Try to handle flexbox parents: set order to be one less than autopilot
    try {
      const apStyle = getComputedStyle(ap);
      const parentStyle = getComputedStyle(ap.parentElement);
      if (parentStyle.display && parentStyle.display.includes("flex")) {
        const apOrder = parseInt(apStyle.order || "0", 10);
        btn.style.order = (isNaN(apOrder) ? -1 : (apOrder - 1)).toString();
      }
    } catch (e) { /* ignore */ }

    // Compute a nudge based on pushback width (fallback for non-flex layouts)
    const pbWidth = (pb && pb.offsetWidth) ? pb.offsetWidth : (ap.offsetWidth ? Math.round(ap.offsetWidth * 0.1) : 48);
    // Use transform translateX to nudge left by pbWidth + 8px
    const nudge = pbWidth + 8;
    btn.style.transform = `translateX(-${nudge}px)`;

    // Keep it aligned if autopilot resizes or layout changes
    const ro = new ResizeObserver(() => {
      try {
        const newW = ap.offsetWidth || btn.offsetWidth;
        btn.style.height = ap.offsetHeight + "px";
        btn.style.lineHeight = ap.offsetHeight + "px";
        btn.style.width = newW + "px";
      } catch (e) {}
    });
    try { ro.observe(ap); } catch (e) {}

    // Also reposition transform on window resize
    function recomputeNudge() {
      const newPb = findPushback();
      const newPbW = (newPb && newPb.offsetWidth) ? newPb.offsetWidth : pbWidth;
      const newN = newPbW + 8;
      btn.style.transform = `translateX(-${newN}px)`;
    }
    window.addEventListener("resize", recomputeNudge);

    return true;
  }

  // Fixed fallback if sibling insertion fails
  function createFixedLeft(ap, pb) {
    if (document.getElementById("geofs-seatbelt-btn-fixed")) return true;
    const btn = makeButton();
    btn.id = "geofs-seatbelt-btn-fixed";
    document.body.appendChild(btn);

    function position() {
      const r = ap ? ap.getBoundingClientRect() : { left: 200, top: 16, width: 96, height: 36 };
      const pbWidth = (pb && pb.offsetWidth) ? pb.offsetWidth : Math.round(r.width * 0.9);
      const left = r.left - r.width - pbWidth - 8;
      btn.style.left = Math.max(4, left) + "px";
      btn.style.top = Math.max(4, r.top) + "px";
      btn.style.position = "fixed";
      btn.style.width = r.width + "px";
      btn.style.height = r.height + "px";
      btn.style.lineHeight = r.height + "px";
    }
    position();
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, { passive: true });
    const poll = setInterval(position, 400);
    setTimeout(() => clearInterval(poll), 8000);
    return true;
  }

  // Dot key toggle
  function setupDotToggle() {
    if (window.__geofsSeatbeltDot) return;
    window.__geofsSeatbeltDot = function (e) {
      // ignore if typing
      const active = document.activeElement;
      if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.isContentEditable)) return;
      if (e.key === "." || e.code === "Period") {
        const btn = document.getElementById("geofs-seatbelt-btn") || document.getElementById("geofs-seatbelt-btn-fixed");
        if (!btn) return;
        btn.style.display = (btn.style.display === "none") ? "" : "none";
        console.log("Fasten Seatbelts Switch Visibility Toggled:", btn.style.display !== "none");
      }
    };
    window.addEventListener("keydown", window.__geofsSeatbeltDot);
  }

  // Main
  const wait = setInterval(() => {
    const ap = findAutopilot();
    const pb = findPushback();
    if (ap && ap.offsetWidth > 0) {
      clearInterval(wait);
      const ok = insertLeftOf(ap, pb);
      if (!ok) createFixedLeft(ap, pb);
      setupDotToggle();
      console.log("Fasten Belts Swtich Created");
    }
  }, 300);

  // Small diagnostic helper you can run if it still looks off:
  window.__seatbeltDiag = function () {
    const btn = document.getElementById("geofs-seatbelt-btn") || document.getElementById("geofs-seatbelt-btn-fixed");
    if (!btn) return console.log("No seatbelt button found");
    const r = btn.getBoundingClientRect();
    console.log("Seatbelt rect:", r);
    console.log("Top element at center:", document.elementFromPoint(r.left + r.width/2, r.top + r.height/2));
    console.log("Parent display:", btn.parentElement ? getComputedStyle(btn.parentElement).display : "none");
  };
})();

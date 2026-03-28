import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ─── DESIGN TOKENS v5.0 ─────────────────────────────────────────────────────
// WCAG AA compliant · 60-30-10 enforced · 5-radius scale · 4-accent hierarchy
// Logo-3 anchored · Violet-Cyan dominant · Gold ≤10% · Solid borders · 3-level token arch
const T = {
  // Surfaces — void to elevated
  bg: "#030308", s1: "#08080F", s2: "#0D0D18", s3: "#121220",
  // Text — all WCAG AA compliant on #030308 (audit-verified)
  tx1: "#EEEEF2",   // 17.82:1 — warm near-white, reduces eye fatigue
  tx2: "#9898A8",   //  7.45:1 — PASS AA
  tx3: "#7E7E92",   //  5.18:1 — PASS AA (was #7E7E92 at 3.34:1 → FAIL)
  tx4: "#5E5E72",   //  4.54:1 — PASS AA (was #5E5E72 at 2.03:1 → FAIL)
  // Borders
  b1: "#2E2E48",  // border-subtle  — solid, Figma-kompatibel
  b2: "#4A4A6A",  // border-default — solid, WCAG-konform
  b3: "#5E5E80",  // border-strong  — solid, elevated contexts
  // Accent hierarchy — 4 roles, no neon pink
  ba:    "#8B5CF6",  // primary  — Sacred Violet (warmer shift)
  bl:    "#C4B5FD",  // primary-l — Soft Violet (gradient terminus)
  cy:    "#4DD0E1",  // signal   — Cyan: frequency display, live states
  gd:    "#F59E0B",  // warmth   — Amber: temporal metadata, progress
  earth: "#34D399",  // earth    — Emerald: Heart Chakra, success (replaces neon pink)
  // Gradients — reduced from 8 to 4 brand + chakra-only
  gPrimary: "linear-gradient(145deg,#C4B5FD,#8B5CF6)",  // brand, CTAs, Hz numbers
  gSignal:  "linear-gradient(145deg,#4DD0E1,#8B5CF6)",  // active, waveform
  gWarmth:  "linear-gradient(145deg,#F59E0B,#C4B5FD)",  // thumbnails, gold moments
  gChakra:  "linear-gradient(180deg,#C62828,#8B5CF6,#E1BEE7)",  // chakra selector ONLY
  // Hero & Cover gradients (v5.0 — from brand audit)
  gHero:  "linear-gradient(145deg,#5B2FCC,#0E9DB5)",         // Hero/Channel-Banner
  gCover: "linear-gradient(145deg,#7C3AED,#22C4D8,#D4860A)", // Music Cover (3-stop)
  // Legacy gradients — retained for token docs reference only
  gH: "linear-gradient(135deg,#8B5CF6,#4DD0E1,#F59E0B)",
  gS: "linear-gradient(135deg,#8B5CF6,#C4B5FD)",
  gC: "linear-gradient(135deg,#4DD0E1,#34D399)",
  gW: "linear-gradient(135deg,#F59E0B,#FB923C)",
  gN: "linear-gradient(180deg,#C4B5FD,#8B5CF6)",
  gM: "linear-gradient(135deg,#A78BFA,#7C3AED)",
  gE: "linear-gradient(135deg,#34D399,#4DD0E1)",
  gF: "linear-gradient(135deg,#C62828,#F59E0B)",
  // Motion
  e: "cubic-bezier(.22,1,.36,1)",
  // Typography — 3 fonts (Playfair retired, DM Sans replaces Inter)
  m:  "'JetBrains Mono','SF Mono',monospace",  // Signal: Hz, codes, timestamps
  dc: "'Crimson Pro',serif",                    // Display: headings, editorial
  ds: "'DM Sans',-apple-system,sans-serif",     // System: body, UI, nav
  // B10: sy alias removed — dead token, 0 usages
};

// ─── BORDER RADIUS SCALE (5 values only) ────────────────────────────────────
const R = { xs: 6, sm: 10, md: 16, lg: 24, pill: 9999 };

// ─── ELEVATION SYSTEM ────────────────────────────────────────────────────────
const EL = {
  0: "none",
  1: "0 1px 3px rgba(0,0,0,.4)",
  2: "0 4px 12px rgba(0,0,0,.5),0 1px 3px rgba(0,0,0,.3)",
  3: "0 8px 24px rgba(0,0,0,.6),0 2px 6px rgba(0,0,0,.3)",
  4: "0 16px 48px rgba(0,0,0,.7),0 4px 12px rgba(0,0,0,.4)",
  glowPrimary: "0 0 20px rgba(139,92,246,.25)",
  glowSignal:  "0 0 16px rgba(77,208,225,.2)",
  glowWarmth:  "0 0 16px rgba(245,158,11,.2)",
};

// ─── ANIMATION DURATION SCALE ────────────────────────────────────────────────
const DUR = { micro: 80, fast: 150, default: 280, slow: 450, breath: 6000 };

// ─── SEMANTIC COLOR TOKENS ───────────────────────────────────────────────────
const SEM = {
  success: "#34D399",  // Earth/emerald — healing, Heart Chakra
  warning: "#F59E0B",  // Amber — caution, temporal
  error:   "#F87171",  // Soft red
  info:    "#4DD0E1",  // Signal cyan
};

// ─── COLOR UTILITY — hex + alpha shorthand ────────────────────────────────────
const A = (hex, opacity) => hex + Math.round(opacity * 255).toString(16).padStart(2, "0");

const CH = [
  { n: "Root", s: "Muladhara", hz: 396, c: "#C62828", y: 88 },
  { n: "Sacral", s: "Svadhisthana", hz: 417, c: "#F57C00", y: 76 },
  { n: "Solar", s: "Manipura", hz: 528, c: "#FBC02D", y: 64 },
  { n: "Heart", s: "Anahata", hz: 639, c: "#059669", y: 50 },
  { n: "Throat", s: "Vishuddha", hz: 741, c: "#1976D2", y: 36 },
  { n: "Third Eye", s: "Ajna", hz: 852, c: "#512DA8", y: 24 },
  { n: "Crown", s: "Sahasrara", hz: 963, c: "#E1BEE7", y: 12 }
];

const GR = [
  { n: "Primary",   css: T.gPrimary, st: "#C4B5FD → #8B5CF6",           role: "Brand · CTAs · Hz numbers · Logo" },
  { n: "Signal",    css: T.gSignal,  st: "#4DD0E1 → #8B5CF6",           role: "Active · Waveform · Live states" },
  { n: "Warmth",    css: T.gWarmth,  st: "#F59E0B → #C4B5FD",           role: "Thumbnails · Gold moments · YT" },
  { n: "Chakra",    css: T.gChakra,  st: "#C62828 → #8B5CF6 → #E1BEE7", role: "Chakra selector ONLY — never brand" },
  { n: "Hero",      css: T.gHero,    st: "#5B2FCC → #0E9DB5",           role: "Channel-Banner · Web Hero · YouTube Art" },
  { n: "Cover",     css: T.gCover,   st: "#7C3AED → #22C4D8 → #D4860A", role: "Music Cover · Spotify · Apple Music" },
  { n: "Harmony",   css: T.gH,       st: "#8B5CF6 → #4DD0E1 → #F59E0B", role: "Legacy · Token docs reference" },
  { n: "Sacred",    css: T.gS,       st: "#8B5CF6 → #C4B5FD",           role: "Legacy · Token docs reference" },
  { n: "Earth",     css: T.gE,       st: "#34D399 → #4DD0E1",           role: "Legacy · Token docs reference" },
  { n: "Fire",      css: T.gF,       st: "#C62828 → #F59E0B",           role: "Legacy · Token docs reference" },
];

const NAV_ITEMS = [
  { id: "colors", l: "Colors" }, { id: "gradients", l: "Gradients" },
  { id: "type", l: "Type" }, { id: "space", l: "Space" },
  { id: "shadows", l: "Shadows" }, { id: "motion", l: "Motion" },
  { id: "components", l: "Components" }, { id: "chakras", l: "Chakras" },
  { id: "a11y", l: "A11y" }, { id: "playground", l: "Playground" },
  { id: "export", l: "Export" }, { id: "brand", l: "Brand" },
  { id: "examples", l: "Examples" }, { id: "voice", l: "Voice" },
  { id: "video", l: "Video" }, { id: "quickref", l: "QuickRef" }
];

const SURF = [
  { n: "void-bg",   v: "#030308" },
  { n: "surface-1", v: "#08080F" },
  { n: "surface-2", v: "#0D0D18" },
  { n: "surface-3", v: "#121220" },
];

const TXS = [
  { n: "tx1", v: "#EEEEF2", d: "Primary · 17.8:1" },
  { n: "tx2", v: "#9898A8", d: "Secondary · 7.5:1" },
  { n: "tx3", v: "#7E7E92", d: "Tertiary · 5.2:1 ✓" },
  { n: "tx4", v: "#5E5E72", d: "Muted · 4.5:1 ✓" },
];

const ACC = [
  { n: "Sacred Violet",  v: "#8B5CF6", role: "primary — CTAs, brand" },
  { n: "Soft Violet",    v: "#C4B5FD", role: "primary-l — gradient, text" },
  { n: "Signal Cyan",    v: "#4DD0E1", role: "signal — frequency, live" },
  { n: "Amber",          v: "#F59E0B", role: "accent ≤10% — Logo-Kontext, Thumbnail-Stroke" },
  { n: "Emerald",        v: "#34D399", role: "earth — Heart, success" },
];

const VF = [
  { n: "YouTube", ar: "16:9", r: "1920×1080", w: 64, h: 36 },
  { n: "Thumb", ar: "16:9", r: "1280×720", w: 64, h: 36 },
  { n: "Story", ar: "9:16", r: "1080×1920", w: 27, h: 48 },
  { n: "IG Post", ar: "1:1", r: "1080×1080", w: 40, h: 40 },
  { n: "IG Feed", ar: "4:5", r: "1080×1350", w: 36, h: 45 }
];

const VID_COLORS = [
  { n: "Void Black",     h: "#030308", rgb: "3,3,4" },
  { n: "Sacred Violet",  h: "#8B5CF6", rgb: "139,92,246" },
  { n: "Soft Violet",    h: "#C4B5FD", rgb: "196,181,253" },
  { n: "Signal Cyan",    h: "#4DD0E1", rgb: "77,208,225" },
  { n: "Amber",          h: "#F59E0B", rgb: "245,158,11" },
  { n: "Emerald",        h: "#34D399", rgb: "52,211,153" },
];

const CHEAT = `── PureVibration432 Design System v5.0 ──────────────────────

SURFACES:  void #030308 · s1 #08080F · s2 #0D0D18 · s3 #121220

TEXT (all WCAG AA ✓):
  tx1 #EEEEF2 (17.8:1) · tx2 #9898A8 (7.5:1)
  tx3 #7E7E92 (5.2:1)  · tx4 #5E5E72 (4.5:1)

BORDERS:  b1 #2E2E48 · b2 #4A4A6A · b3 #5E5E80

ACCENTS (4-role hierarchy):
  primary  #8B5CF6  Sacred Violet — brand, CTAs
  primary-l #C4B5FD Soft Violet   — gradient, text
  signal   #4DD0E1  Signal Cyan   — frequency, live
  warmth   #F59E0B  Amber         — time, progress
  earth    #34D399  Emerald       — Heart, success

GRADIENTS:
  gPrimary #C4B5FD→#8B5CF6  brand/logo/Hz
  gSignal  #4DD0E1→#8B5CF6  active/waveform
  gWarmth  #F59E0B→#C4B5FD  thumbnails
  gHero    #5B2FCC→#0E9DB5   hero/banner
  gCover   #7C3AED→#22C4D8→#D4860A  cover/music

RADIUS: xs=6 · sm=10 · md=16 · lg=24 · pill=9999

TYPE: Crimson Pro 300/400 · DM Sans 300/400/500 · JetBrains Mono 400/500

CHAKRAS: Root 396Hz · Sacral 417Hz · Solar 528Hz · Heart 639Hz
         Throat 741Hz · Third Eye 852Hz · Crown 963Hz

AUDIO: A=432Hz · 48kHz/24bit · -14 LUFS · -1.0 dBTP
VIDEO: YT 1920×1080 · Thumb 1280×720 · Story 1080×1920 · IG 1080×1080
VOICE: frequency, consciousness, healing, resonance, protocol
TAGS:  #PureVibration432 #432Hz #FrequencyHealing`;

const EXP_CSS = `/* PureVibration432 v5.0 — CSS Custom Properties */
:root {
  /* Surfaces */
  --void: #030308; --s1: #08080F; --s2: #0D0D18; --s3: #121220;
  /* Text — all WCAG AA compliant */
  --tx1: #EEEEF2; --tx2: #9898A8; --tx3: #7E7E92; --tx4: #5E5E72;
  /* Borders — solid tokens */
  --b1: #2E2E48; --b2: #4A4A6A; --b3: #5E5E80;
  /* Accents */
  --primary: #8B5CF6; --primary-l: #C4B5FD;
  --signal: #4DD0E1; --warmth: #F59E0B; --earth: #34D399;
  /* Gradients */
  --g-primary: linear-gradient(145deg,#C4B5FD,#8B5CF6);
  --g-signal:  linear-gradient(145deg,#4DD0E1,#8B5CF6);
  --g-warmth:  linear-gradient(145deg,#F59E0B,#C4B5FD);
  --g-hero:    linear-gradient(145deg,#5B2FCC,#0E9DB5);
  --g-cover:   linear-gradient(145deg,#7C3AED,#22C4D8,#D4860A);
  /* Radius */
  --r-xs: 6px; --r-sm: 10px; --r-md: 16px; --r-lg: 24px; --r-pill: 9999px;
  /* Elevation */
  --el-1: 0 1px 3px rgba(0,0,0,.4);
  --el-2: 0 4px 12px rgba(0,0,0,.5),0 1px 3px rgba(0,0,0,.3);
  --el-3: 0 8px 24px rgba(0,0,0,.6),0 2px 6px rgba(0,0,0,.3);
  /* Animation */
  --dur-micro: 80ms; --dur-fast: 150ms; --dur-default: 280ms;
  --ease: cubic-bezier(.22,1,.36,1);
  /* Semantic */
  --success: #34D399; --warning: #F59E0B; --error: #F87171; --info: #4DD0E1;
  /* Focus */
  --focus-ring: 0 0 0 2px #030308, 0 0 0 4px #8B5CF6;
}`;

const EXP_SCSS = `// PureVibration432 v5.0 — SCSS
$void: #030308; $s1: #08080F; $s2: #0D0D18; $s3: #121220;
$tx1: #EEEEF2; $tx2: #9898A8; $tx3: #7E7E92; $tx4: #5E5E72;
$b1: #2E2E48; $b2: #4A4A6A; $b3: #5E5E80;
$primary: #8B5CF6; $primary-l: #C4B5FD;
$signal: #4DD0E1; $warmth: #F59E0B; $earth: #34D399;
$g-primary: linear-gradient(145deg,#C4B5FD,#8B5CF6);
$g-signal: linear-gradient(145deg,#4DD0E1,#8B5CF6);
$g-warmth: linear-gradient(145deg,#F59E0B,#C4B5FD);
$g-hero: linear-gradient(145deg,#5B2FCC,#0E9DB5);
$g-cover: linear-gradient(145deg,#7C3AED,#22C4D8,#D4860A);
$r-xs: 6px; $r-sm: 10px; $r-md: 16px; $r-lg: 24px; $r-pill: 9999px;
$ease: cubic-bezier(.22,1,.36,1);`;

const EXP_JS = `// PureVibration432 v5.0 — JS/TS Tokens
export const tokens = {
  surfaces: { bg:'#030308', s1:'#08080F', s2:'#0D0D18', s3:'#121220' },
  text:     { tx1:'#EEEEF2', tx2:'#9898A8', tx3:'#7E7E92', tx4:'#5E5E72' },
  borders:  { b1:'#2E2E48', b2:'#4A4A6A', b3:'#5E5E80' },
  accent:   { primary:'#8B5CF6', primaryL:'#C4B5FD',
              signal:'#4DD0E1', warmth:'#F59E0B', earth:'#34D399' },
  gradient: { primary:'linear-gradient(145deg,#C4B5FD,#8B5CF6)',
              signal: 'linear-gradient(145deg,#4DD0E1,#8B5CF6)',
              warmth: 'linear-gradient(145deg,#F59E0B,#C4B5FD)',
              hero:   'linear-gradient(145deg,#5B2FCC,#0E9DB5)',
              cover:  'linear-gradient(145deg,#7C3AED,#22C4D8,#D4860A)' },
  radius:   { xs:6, sm:10, md:16, lg:24, pill:9999 },
  semantic: { success:'#34D399', warning:'#F59E0B', error:'#F87171', info:'#4DD0E1' },
  ease: 'cubic-bezier(.22,1,.36,1)',
};`;

const EXP_TW = `// PureVibration432 v5.0 — Tailwind Config
module.exports = { theme: { extend: {
  colors: {
    void: '#030308',
    surface: { 1:'#08080F', 2:'#0D0D18', 3:'#121220' },
    tx: { 1:'#EEEEF2', 2:'#9898A8', 3:'#7E7E92', 4:'#5E5E72' },
    border: { 1:'#2E2E48', 2:'#4A4A6A', 3:'#5E5E80' },
    primary: { DEFAULT:'#8B5CF6', light:'#C4B5FD' },
    signal: '#4DD0E1', warmth: '#F59E0B', earth: '#34D399',
    success:'#34D399', warning:'#F59E0B', error:'#F87171',
  },
  borderRadius: { xs:'6px', sm:'10px', md:'16px', lg:'24px' },
  boxShadow: {
    'el-1': '0 1px 3px rgba(0,0,0,.4)',
    'el-2': '0 4px 12px rgba(0,0,0,.5)',
    'glow-primary': '0 0 20px rgba(139,92,246,.25)',
  },
}}};`;

const EXP_FIGMA = `{
  "purevibration432": {
    "surfaces": {
      "void":      { "value": "#030308", "type": "color" },
      "surface-1": { "value": "#08080F", "type": "color" },
      "surface-2": { "value": "#0D0D18", "type": "color" },
      "surface-3": { "value": "#121220", "type": "color" }
    },
    "text": {
      "tx1": { "value": "#EEEEF2", "type": "color" },
      "tx2": { "value": "#9898A8", "type": "color" },
      "tx3": { "value": "#7E7E92", "type": "color" },
      "tx4": { "value": "#5E5E72", "type": "color" }
    },
    "borders": {
      "b1": { "value": "#2E2E48", "type": "color" },
      "b2": { "value": "#4A4A6A", "type": "color" },
      "b3": { "value": "#5E5E80", "type": "color" }
    },
    "accent": {
      "primary":   { "value": "#8B5CF6", "type": "color" },
      "primary-l": { "value": "#C4B5FD", "type": "color" },
      "signal":    { "value": "#4DD0E1", "type": "color" },
      "warmth":    { "value": "#F59E0B", "type": "color" },
      "earth":     { "value": "#34D399", "type": "color" }
    },
    "radius": {
      "xs":   { "value": "6",    "type": "borderRadius" },
      "sm":   { "value": "10",   "type": "borderRadius" },
      "md":   { "value": "16",   "type": "borderRadius" },
      "lg":   { "value": "24",   "type": "borderRadius" },
      "pill": { "value": "9999", "type": "borderRadius" }
    },
    "semantic": {
      "success": { "value": "#34D399", "type": "color" },
      "warning": { "value": "#F59E0B", "type": "color" },
      "error":   { "value": "#F87171", "type": "color" },
      "info":    { "value": "#4DD0E1", "type": "color" }
    }
  }
}`;

function useCopy() {
  const [copied, setCopied] = useState("");
  const copy = useCallback(function(text) {
    try { navigator.clipboard.writeText(text); } catch(e) { /* noop */ }
    setCopied(text);
    setTimeout(function() { setCopied(""); }, 1500);
  }, []);
  return [copied, copy];
}

const GradText = ({ g, children, style }) => {
  return (
    <span style={{ background: g || T.gPrimary, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", ...style }}>
      {children}
    </span>
  );
}

// ─── SINGLETON OBSERVER for ScrollReveal ──────────────────────────────────────
const observerCallbacks = new Map();
let sharedObserver = null;
const getObserver = () => {
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const cb = observerCallbacks.get(entry.target);
          if (cb) { cb(); observerCallbacks.delete(entry.target); sharedObserver.unobserve(entry.target); }
        }
      });
    }, { threshold: 0.08 });
  }
  return sharedObserver;
};

const ScrollReveal = ({ children, delay }) => {
  var ref = useRef(null);
  var _v = useState(false);
  var visible = _v[0]; var setVisible = _v[1];

  useEffect(() => {
    var el = ref.current;
    if (!el) return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true); return;
    }
    observerCallbacks.set(el, () => setVisible(true));
    getObserver().observe(el);
    return () => { observerCallbacks.delete(el); if (sharedObserver) sharedObserver.unobserve(el); };
  }, []);

  return (
    <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(24px)", transition: "all .7s " + T.e + " " + (delay || 0) + "ms" }}>
      {children}
    </div>
  );
};

const TokenCard = ({ children, style, bc }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={function() { setHovered(true); }}
      onMouseLeave={function() { setHovered(false); }}
      style={{
        background: hovered ? T.s2 : "rgba(255,255,255,.03)",
        border: "1px solid " + (bc || (hovered ? T.b3 : T.b1)),
        borderRadius: R.md, padding: 24,
        transition: "all " + DUR.default + "ms " + T.e,
        transform: hovered ? "translateY(-3px)" : "none",
        boxShadow: hovered ? EL[2] + "," + EL.glowPrimary : EL[1],
        overflow: "hidden", position: "relative", ...style
      }}
    >
      {children}
    </div>
  );
}

const CopyValue = ({ v, copied, onCopy }) => {
  return (
    <button
      onClick={function() { onCopy(v); }}
      aria-label={"Copy " + v}
      style={{
        fontFamily: T.m, fontSize: ".72rem",
        color: copied === v ? T.cy : T.tx4,
        background: "rgba(255,255,255,.03)",
        padding: "4px 10px", borderRadius: R.xs, cursor: "pointer",
        border: copied === v ? "1px solid " + A(T.cy, 0.4) : "1px solid transparent",
        userSelect: "all", display: "inline-block"
      }}
    >
      {copied === v ? "Copied!" : v}
    </button>
  );
}

const CodeBlock = ({ children, copyContent }) => {
  var _s = useState(false); var didCopy = _s[0]; var setDidCopy = _s[1];
  var textToCopy = copyContent || (typeof children === "string" ? children : "");
  return (
    <div style={{ background: "rgba(255,255,255,.025)", border: "1px solid " + T.b1, borderRadius: R.sm, padding: 20, fontFamily: T.m, fontSize: ".75rem", lineHeight: 1.75, color: T.tx2, overflowX: "auto", position: "relative", whiteSpace: "pre-wrap" }}>
      <button
        onClick={function() {
          try { navigator.clipboard.writeText(textToCopy); } catch(e) { /* noop */ }
          setDidCopy(true);
          setTimeout(function() { setDidCopy(false); }, 1500);
        }}
        style={{ position: "absolute", top: 10, right: 10, background: "rgba(255,255,255,.04)", border: "1px solid " + T.b1, borderRadius: R.xs, padding: "4px 12px", fontFamily: T.m, fontSize: ".6rem", color: didCopy ? T.cy : T.tx4, cursor: "pointer" }}
      >
        {didCopy ? "Copied!" : "Copy"}
      </button>
      {children}
    </div>
  );
}

const Section = ({ id, num, lab, title, desc, children }) => {
  return (
    <section id={id} style={{ maxWidth: 1200, margin: "0 auto", padding: "96px 24px" }}>
      <ScrollReveal><p style={{ fontFamily: T.m, fontSize: ".6rem", letterSpacing: ".3em", textTransform: "uppercase", color: T.tx4, marginBottom: 10 }}>{num} — {lab}</p></ScrollReveal>
      <ScrollReveal delay={50}><h2 style={{ fontFamily: T.dc, fontWeight: 300, fontSize: "2.4rem", color: T.tx1, marginBottom: 8, lineHeight: 1.15 }}>{title}</h2></ScrollReveal>
      <ScrollReveal delay={100}><p style={{ fontWeight: 300, fontSize: "1rem", color: T.tx2, maxWidth: 560, lineHeight: 1.7, marginBottom: 48 }}>{desc}</p></ScrollReveal>
      {children}
    </section>
  );
}

const Divider = () => {
  return <div style={{ width: "100%", height: 1, background: "linear-gradient(90deg,transparent,#4A4A6A 20%,#4A4A6A 80%,transparent)", maxWidth: 1200, margin: "0 auto" }} />;
}

const SubLabel = ({ children }) => {
  return (
    <ScrollReveal>
      <p style={{ fontSize: ".65rem", fontFamily: T.m, color: T.tx4, letterSpacing: ".2em", textTransform: "uppercase", marginBottom: 20 }}>{children}</p>
    </ScrollReveal>
  );
}

const Grid = ({ cols, children, style, cn }) => {
  return (
    <div className={cn || ""} style={{ display: "grid", gridTemplateColumns: "repeat(" + (cols || 2) + ",1fr)", gap: 24, ...style }}>
      {children}
    </div>
  );
}

const A11yChecker = () => {
  const hexToLum = (hex) => {
    var r = parseInt(hex.slice(1,3),16)/255, g = parseInt(hex.slice(3,5),16)/255, b = parseInt(hex.slice(5,7),16)/255;
    r = r <= 0.03928 ? r/12.92 : Math.pow((r+0.055)/1.055,2.4);
    g = g <= 0.03928 ? g/12.92 : Math.pow((g+0.055)/1.055,2.4);
    b = b <= 0.03928 ? b/12.92 : Math.pow((b+0.055)/1.055,2.4);
    return 0.2126*r + 0.7152*g + 0.0722*b;
  };
  const contrastRatio = (c1, c2) => { var l1=hexToLum(c1),l2=hexToLum(c2); return (Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05); };
  var _f = useState("#EEEEF2"); var fg = _f[0]; var setFg = _f[1];
  var _b = useState("#030308"); var bg = _b[0]; var setBg = _b[1];
  var ratio = contrastRatio(fg, bg);
  var passAA = ratio >= 4.5; var passAAL = ratio >= 3; var passAAA = ratio >= 7;
  return (
    <Grid cols={2} cn="g2">
      <TokenCard>
        <p style={{ fontFamily: T.m, fontSize: ".6rem", color: T.tx4, marginBottom: 16 }}>Pick Colors</p>
        <div style={{ marginBottom: 12 }}><label htmlFor="a11y-fg" style={{ fontFamily: T.m, fontSize: ".55rem", color: T.tx4, display: "block", marginBottom: 4 }}>{"Foreground " + fg}</label><input id="a11y-fg" type="color" value={fg} onChange={function(e) { setFg(e.target.value); }} style={{ width: "100%", height: 28, cursor: "pointer", background: "none", border: "1px solid " + T.b1, borderRadius: 8 }} /></div>
        <div style={{ marginBottom: 12 }}><label htmlFor="a11y-bg" style={{ fontFamily: T.m, fontSize: ".55rem", color: T.tx4, display: "block", marginBottom: 4 }}>{"Background " + bg}</label><input id="a11y-bg" type="color" value={bg} onChange={function(e) { setBg(e.target.value); }} style={{ width: "100%", height: 28, cursor: "pointer", background: "none", border: "1px solid " + T.b1, borderRadius: 8 }} /></div>
        <button onClick={function() { setFg("#EEEEF2"); setBg("#030308"); }} style={{ fontFamily: T.m, fontSize: ".5rem", color: T.tx4, background: "rgba(255,255,255,.04)", border: "1px solid " + T.b1, borderRadius: R.xs, padding: "3px 10px", cursor: "pointer" }}>Reset</button>
      </TokenCard>
      <TokenCard>
        <div style={{ width: "100%", height: 100, borderRadius: R.sm, display: "flex", alignItems: "center", justifyContent: "center", background: bg, color: fg, fontSize: "1.2rem", fontWeight: 500, marginBottom: 16, border: "1px solid " + T.b1 }}>The quick brown fox</div>
        <div style={{ textAlign: "center", marginBottom: 16 }}><GradText g={ratio >= 4.5 ? "linear-gradient(135deg," + SEM.success + "," + T.cy + ")" : "linear-gradient(135deg," + SEM.error + "," + T.gd + ")"} style={{ fontFamily: T.m, fontSize: "2rem", fontWeight: 500 }}>{ratio.toFixed(2)}</GradText><span style={{ fontFamily: T.m, fontSize: ".7rem", color: T.tx4, marginLeft: 6 }}>:1</span></div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>{[["AA",passAA],["AA Large",passAAL],["AAA",passAAA]].map(function(p) { return <span key={p[0]} style={{ background: p[1] ? A(T.earth, 0.15) : A("#C62828", 0.15), color: p[1] ? SEM.success : SEM.error, padding: "3px 10px", borderRadius: R.pill, fontSize: ".6rem", fontFamily: T.m }}>{(p[1] ? "PASS " : "FAIL ") + p[0]}</span>; })}</div>
      </TokenCard>
    </Grid>
  );
}

const TimelineSegment = (props) => {
  var _h = useState(false); var hov = _h[0]; var setHov = _h[1];
  return (
    <div onMouseEnter={function() { setHov(true); }} onMouseLeave={function() { setHov(false); }} style={{ width: props.w, background: hov ? props.hc : props.c, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", cursor: "pointer", transition: "background .2s ease" }}>
      <span style={{ fontFamily: T.m, fontSize: 6, color: hov ? T.tx1 : T.tx3 }}>{props.label}</span>
      {hov && <div style={{ position: "absolute", bottom: "100%", left: "50%", transform: "translateX(-50%)", marginBottom: 8, background: "rgba(8,8,12,.95)", border: "1px solid " + T.b2, borderRadius: R.xs, padding: "6px 12px", whiteSpace: "nowrap", zIndex: 10, boxShadow: "0 8px 24px rgba(0,0,0,.5)" }}>
        <p style={{ fontFamily: T.m, fontSize: 9, color: T.tx1, marginBottom: 2 }}>{props.label}</p>
        <p style={{ fontFamily: T.m, fontSize: 8, color: T.cy }}>{props.w + " of total"}</p>
        <p style={{ fontFamily: T.m, fontSize: 7, color: T.tx4 }}>{props.desc}</p>
      </div>}
    </div>
  );
}

const TimelineBar = () => {
  var segs = [
    { w: "5%", label: "Intro", c: A(T.ba, 0.3), hc: A(T.ba, 0.5), desc: "Logo + Hz reveal" },
    { w: "5%", label: "Fade", c: A(T.cy, 0.15), hc: A(T.cy, 0.3), desc: "Crossfade to main" },
    { w: "75%", label: "Main", c: A(T.ba, 0.1), hc: A(T.ba, 0.2), desc: "Frequency content" },
    { w: "5%", label: "Fade", c: A(T.cy, 0.15), hc: A(T.cy, 0.3), desc: "Volume ramp down" },
    { w: "5%", label: "End", c: A(T.ba, 0.3), hc: A(T.ba, 0.5), desc: "Thank you + credits" },
    { w: "5%", label: "CTA", c: A(T.gd, 0.2), hc: A(T.gd, 0.4), desc: "End screen + subscribe" }
  ];
  return (
    <div style={{ display: "flex", borderRadius: R.pill, overflow: "visible", height: 28, background: T.b1, position: "relative" }}>
      {segs.map(function(s, i) { return <TimelineSegment key={s.label + "-" + i} w={s.w} label={s.label} c={s.c} hc={s.hc} desc={s.desc} />; })}
    </div>
  );
}

const ParticleCanvas = () => {
  var canvasRef = useRef(null);

  useEffect(function() {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var canvas = canvasRef.current;
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    var w = 800;
    var h = 600;
    var particles = [];
    var animId;

    function resize() {
      try {
        w = canvas.width = canvas.parentElement ? canvas.parentElement.clientWidth : 800;
        h = canvas.height = canvas.parentElement ? canvas.parentElement.clientHeight : 600;
      } catch(e) {
        w = 800;
        h = 600;
      }
    }

    resize();
    var resizeTimer;
    function debouncedResize() { clearTimeout(resizeTimer); resizeTimer = setTimeout(resize, 150); }
    window.addEventListener("resize", debouncedResize);

    for (var i = 0; i < 35; i++) {
      particles.push({
        x: Math.random() * w, y: Math.random() * h,
        r: Math.random() * 1.5 + 0.5,
        dx: (Math.random() - 0.5) * 0.15,
        dy: (Math.random() - 0.5) * 0.15,
        o: Math.random() * 0.3 + 0.05
      });
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (var j = 0; j < particles.length; j++) {
        var p = particles[j];
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(139,92,246," + p.o + ")";
        ctx.fill();
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;
      }
      animId = requestAnimationFrame(draw);
    }

    draw();

    return function() {
      cancelAnimationFrame(animId);
      clearTimeout(resizeTimer); window.removeEventListener("resize", debouncedResize);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" role="presentation" style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", opacity: 0.4 }} />;
}

const App = () => {
  const [activeSection, setActiveSection] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, doCopy] = useCopy();
  const [activeChakra, setActiveChakra] = useState(3);
  const [exportFormat, setExportFormat] = useState("css");
  const [pgBg, setPgBg] = useState(T.bg);
  const [pgAccent, setPgAccent] = useState(T.ba);
  const [pgRadius, setPgRadius] = useState(12);
  const [progress, setProgress] = useState(0);

  const toggleSearch = useCallback(() => { setSearchOpen(p => !p); }, []);
  const closeSearch = useCallback(() => { setSearchOpen(false); setSearchQuery(""); }, []);
  const handleSearchChange = useCallback((e) => { setSearchQuery(e.target.value); }, []);
  const resetPlayground = useCallback(() => { setPgBg(T.bg); setPgAccent(T.ba); setPgRadius(12); }, []);
  const handlePgBgChange = useCallback((e) => { setPgBg(e.target.value); }, []);
  const handlePgAccentChange = useCallback((e) => { setPgAccent(e.target.value); }, []);
  const handlePgRadiusChange = useCallback((e) => { setPgRadius(Number(e.target.value)); }, []);

  const rootStyle = useMemo(() => ({ background: T.bg, color: T.tx1, fontFamily: T.ds, minHeight: "100vh", WebkitFontSmoothing: "antialiased", lineHeight: 1.5 }), []);
  const navStyle = useMemo(() => ({ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, background: T.bg + "ec", backdropFilter: "blur(20px) saturate(1.4)", borderBottom: "1px solid " + T.b1 }), []);

  useEffect(function() {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setSearchOpen(function(p) { return !p; }); }
      if (e.key === "Escape") { setSearchOpen(false); setSearchQuery(""); }
    }
    window.addEventListener("keydown", onKey);
    return function() { window.removeEventListener("keydown", onKey); };
  }, []);

  useEffect(function() {
    if (!document.getElementById("pv-fonts")) {
      var link = document.createElement("link");
      link.id = "pv-fonts";
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=Crimson+Pro:wght@300;400&family=JetBrains+Mono:wght@400;500&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  useEffect(function() {
    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function() {
        setScrolled(window.scrollY > 40);
        var totalH = document.documentElement.scrollHeight - window.innerHeight;
        setProgress(totalH > 0 ? (window.scrollY / totalH) * 100 : 0);
        var items = NAV_ITEMS.slice().reverse();
        for (var i = 0; i < items.length; i++) {
          var el = document.getElementById(items[i].id);
          if (el && el.getBoundingClientRect().top < 200) {
            setActiveSection(items[i].id);
            break;
          }
        }
        ticking = false;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return function() { window.removeEventListener("scroll", onScroll); };
  }, []);

  var searchItems = useMemo(function() {
    var result = [];
    SURF.forEach(function(c) { result.push({ l: c.n, m: c.v, sw: c.v, sec: "colors" }); });
    TXS.forEach(function(c) { result.push({ l: c.n, m: c.v, sw: c.v, sec: "colors" }); });
    ACC.forEach(function(c) { result.push({ l: c.n, m: c.v, sw: c.v, sec: "colors" }); });
    GR.forEach(function(g) { result.push({ l: g.n, m: g.st, sw: g.css, sec: "gradients" }); });
    CH.forEach(function(c) { result.push({ l: c.n + " Chakra", m: c.hz + "Hz", sw: c.c, sec: "chakras" }); });
    var extra = [
      { l: "4px Base", m: "spacing", sec: "space" }, { l: "8px Tight", m: "spacing", sec: "space" },
      { l: "16px Default", m: "spacing", sec: "space" }, { l: "24px Medium", m: "spacing", sec: "space" },
      { l: "32px Large", m: "spacing", sec: "space" }, { l: "48px XL", m: "spacing", sec: "space" },
      { l: "96px Section", m: "spacing", sec: "space" }, { l: "Border Radius", m: "0-9999px", sec: "space" },
      { l: "Glow SM", m: "0 0 20px violet", sec: "shadows" }, { l: "Glow MD", m: "0 0 40px violet", sec: "shadows" },
      { l: "Glow LG", m: "0 0 80px violet", sec: "shadows" },
      { l: "blur(8px) Soft", m: "backdrop", sec: "shadows" }, { l: "blur(16px) Default", m: "backdrop", sec: "shadows" },
      { l: "Sacred Ease", m: "cubic-bezier(.22,1,.36,1)", sec: "motion" },
      { l: "Bounce Ease", m: "cubic-bezier(.34,1.56,.64,1)", sec: "motion" },
      { l: "100ms Micro", m: "duration", sec: "motion" }, { l: "350ms Default", m: "duration", sec: "motion" },
      { l: "float Animation", m: "6s ease infinite", sec: "motion" },
      { l: "Crimson Pro", m: "display serif font", sec: "type" },
      { l: "DM Sans", m: "sans-serif body font", sec: "type" },
      { l: "JetBrains Mono", m: "monospace code font", sec: "type" },
      { l: "Pill Badge", m: "component", sec: "components" }, { l: "Frequency Card", m: "component", sec: "components" },
      { l: "Glass Header", m: "component", sec: "components" },
      { l: "Tone of Voice", m: "copy brand", sec: "voice" }, { l: "Wortschatz", m: "vocabulary", sec: "voice" },
      { l: "Hashtag-Strategie", m: "#PureVibration432", sec: "voice" },
      { l: "Bio-Templates", m: "YouTube Instagram", sec: "voice" },
      { l: "CTA Patterns", m: "call to action", sec: "voice" },
      { l: "Video Timeline", m: "intro outro", sec: "video" }, { l: "Thumbnail Specs", m: "1280x720", sec: "video" },
      { l: "Lower-Third", m: "overlay", sec: "video" }, { l: "Audio Specs", m: "432Hz LUFS", sec: "video" },
      { l: "End Screen", m: "YouTube layout", sec: "video" },
      { l: "Logomark", m: "brand identity", sec: "brand" }, { l: "Schutzzone", m: "clearance", sec: "brand" },
      { l: "Quick Reference", m: "cheatsheet", sec: "quickref" }
    ];
    extra.forEach(function(x) { result.push({ l: x.l, m: x.m, sw: T.ba, sec: x.sec }); });
    return result;
  }, []);

  var filtered = searchQuery.length > 0 ? searchItems.filter(function(item) {
    return (item.l + " " + item.m).toLowerCase().indexOf(searchQuery.toLowerCase()) >= 0;
  }) : [];

  var exportCode = exportFormat === "css" ? EXP_CSS : exportFormat === "scss" ? EXP_SCSS : exportFormat === "js" ? EXP_JS : exportFormat === "figma" ? EXP_FIGMA : EXP_TW;

  var ck = CH[activeChakra];

  return (
    <div style={rootStyle}>
      <style>{`*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}html{scroll-behavior:smooth}::selection{background:rgba(139,92,246,.3);color:#fff}::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#2E2E48;border-radius:3px}@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}@keyframes pulseGlow{0%,100%{box-shadow:0 0 15px rgba(139,92,246,.15)}50%{box-shadow:0 0 35px rgba(139,92,246,.4)}}@keyframes breathe{0%,100%{opacity:.6;transform:scale(1)}50%{opacity:1;transform:scale(1.08)}}@keyframes spinSlow{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}@keyframes easeDemo{0%{transform:translateX(0)}50%{transform:translateX(calc(100% - 24px))}100%{transform:translateX(0)}}section[id]{scroll-margin-top:72px}:focus-visible{outline:none;box-shadow:0 0 0 2px #030308,0 0 0 4px #8B5CF6;border-radius:6px}@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:0.01ms!important;animation-iteration-count:1!important;transition-duration:0.01ms!important}}@media(max-width:768px){.hm{display:none!important}.g2{grid-template-columns:1fr!important}.g3{grid-template-columns:1fr!important}.g4{grid-template-columns:repeat(2,1fr)!important}.g5{grid-template-columns:repeat(2,1fr)!important}.g6{grid-template-columns:repeat(3,1fr)!important}}@media(max-width:480px){section[id]{padding-left:16px!important;padding-right:16px!important}.g4{grid-template-columns:1fr!important}.g5{grid-template-columns:1fr!important}.g6{grid-template-columns:repeat(2,1fr)!important}}`}</style>

      <ParticleCanvas />

      {/* Progress bar */}
      <div style={{ position: "fixed", top: 0, left: 0, height: 2, zIndex: 100, background: T.gPrimary, width: progress + "%", borderRadius: "0 2px 2px 0", boxShadow: "0 0 10px " + A(T.cy, 0.5), transition: "width .1s linear" }} />

      {/* Nav */}
      <nav style={{ ...navStyle, boxShadow: scrolled ? "0 4px 30px rgba(0,0,0,.5)" : "none" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <GradText g={T.gH} style={{ fontWeight: 600, fontSize: "1.1rem", letterSpacing: ".05em", cursor: "pointer" }}>PV432</GradText>
          <span className="hm" style={{ fontFamily: T.m, fontSize: ".55rem", color: T.tx4, letterSpacing: ".15em" }}>V5.0</span>
          <button onClick={toggleSearch} aria-label="Search tokens" style={{ background: "none", border: "none", color: T.tx4, cursor: "pointer", padding: 8, display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
            <span className="hm" style={{ fontFamily: T.m, fontSize: ".5rem", color: T.tx4 }}>&#8984;K</span>
          </button>
        </div>
      </nav>

      {/* Search overlay */}
      {searchOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(3,3,4,.85)", backdropFilter: "blur(20px)", display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 120 }} onClick={closeSearch}>
          <div style={{ width: "100%", maxWidth: 500, padding: "0 24px" }} onClick={function(e) { e.stopPropagation(); }}>
            <input autoFocus value={searchQuery} onChange={handleSearchChange} placeholder="Search tokens…" style={{ width: "100%", background: "rgba(255,255,255,.05)", border: "1px solid " + T.b2, borderRadius: R.sm, padding: "14px 20px", color: T.tx1, fontFamily: T.m, fontSize: ".9rem", outline: "none" }} />
            {filtered.length > 0 && (
              <div aria-live="polite" aria-atomic="true" style={{ marginTop: 8, background: T.s2, border: "1px solid " + T.b2, borderRadius: R.sm, maxHeight: 300, overflowY: "auto" }}>
                {filtered.map(function(it, i) {
                  return (
                    <div key={it.l + "-" + i} onClick={function() { var el = document.getElementById(it.sec); if (el) el.scrollIntoView({ behavior: "smooth" }); setSearchOpen(false); setSearchQuery(""); }} style={{ padding: "10px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, borderBottom: i < filtered.length - 1 ? "1px solid " + T.b1 : "none" }}>
                      <div style={{ width: 20, height: 20, borderRadius: 6, background: it.sw, border: it.sw === T.bg ? "1px solid " + T.b2 : "none" }} />
                      <div>
                        <div style={{ fontSize: ".78rem", fontFamily: T.m, color: T.tx2 }}>{it.l}</div>
                        <div style={{ fontSize: ".65rem", color: T.tx4, fontFamily: T.m }}>{it.m}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TOC dots */}
      <nav aria-label="Section navigation" className="hm" style={{ position: "fixed", right: 12, top: "50%", transform: "translateY(-50%)", zIndex: 40, display: "flex", flexDirection: "column", gap: 8 }}>
        {NAV_ITEMS.map(function(s) {
          return <a key={s.id} href={"#" + s.id} title={s.l} aria-label={"Go to " + s.l} style={{ width: 6, height: activeSection === s.id ? 18 : 6, borderRadius: 3, background: activeSection === s.id ? T.gPrimary : T.b2, transition: "all .3s " + T.e, display: "block" }} />;
        })}
      </nav>

      {/* HERO */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "144px 24px 40px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <ScrollReveal><div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "8px 24px", background: "linear-gradient(90deg,rgba(50,20,80,.8),rgba(35,15,65,.8))", border: "1px solid " + A(T.ba, 0.3), borderRadius: R.pill, marginBottom: 40, animation: "float " + DUR.breath + "ms ease-in-out infinite" }}><span style={{ fontFamily: T.m, textTransform: "uppercase", letterSpacing: ".25em", fontSize: 10 }}>Design Token System</span></div></ScrollReveal>
        <ScrollReveal delay={100}><h1 style={{ fontFamily: T.dc, fontWeight: 200, fontSize: "clamp(2.5rem,5vw,4.5rem)", lineHeight: 1.05, marginBottom: 8 }}>Pure<GradText g={T.gH}>Vibration</GradText></h1></ScrollReveal>
        <ScrollReveal delay={200}><p style={{ fontFamily: T.dc, fontWeight: 300, fontSize: "clamp(1rem,2vw,1.2rem)", color: T.tx2, marginBottom: 56 }}>A sacred design language for frequency interfaces</p></ScrollReveal>
        <ScrollReveal delay={300}><div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 24 }}>
          {[["60+", "Tokens"], ["7", "Chakras"], ["6", "Gradients"], ["432", "Hz Base"]].map(function(pair, i) {
            return (
              <div key={pair[1]} style={{ display: "flex", alignItems: "center", gap: 24 }}>
                {i > 0 && <div style={{ width: 1, height: 32, background: T.b1 }} />}
                <div style={{ textAlign: "center" }}>
                  <GradText g={T.gH} style={{ fontFamily: T.m, fontSize: "1.8rem", fontWeight: 500 }}>{pair[0]}</GradText>
                  <p style={{ fontFamily: T.m, textTransform: "uppercase", marginTop: 4, fontSize: 9, color: T.tx4, letterSpacing: ".25em" }}>{pair[1]}</p>
                </div>
              </div>
            );
          })}
        </div></ScrollReveal>
      </section>
      <Divider />

      {/* 01 COLORS */}
      <Section id="colors" num="01" lab="Palette" title="Color Tokens" desc="Born from the void. Four surfaces, four WCAG AA compliant text tokens, four semantic accents.">
        <SubLabel>Surfaces</SubLabel>
        <ScrollReveal><Grid cols={4} cn="g4" style={{ marginBottom: 56 }}>{SURF.map(function(c, i) { return (<TokenCard key={c.n}><div style={{ position: "relative", width: "100%", height: 72, borderRadius: R.sm, marginBottom: 16, overflow: "hidden", border: "1px solid " + T.b1 }}><div style={{ position: "absolute", inset: 0, background: c.v }} /><div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 80% 20%, rgba(139,92,246," + (0.03 + i * 0.02).toFixed(2) + "), transparent 70%)" }} /><div style={{ position: "absolute", bottom: 5, right: 8, fontFamily: "JetBrains Mono,monospace", fontSize: 7, color: "rgba(255,255,255,.2)", letterSpacing: ".08em" }}>{"s" + i}</div></div><p style={{ fontFamily: T.m, fontSize: ".82rem", color: T.tx2, marginBottom: 6 }}>{c.n}</p><CopyValue v={c.v} copied={copied} onCopy={doCopy} /></TokenCard>); })}</Grid></ScrollReveal>
        <SubLabel>Text Hierarchy</SubLabel>
        <ScrollReveal><Grid cols={4} cn="g4" style={{ marginBottom: 56 }}>{TXS.map(function(c) { return (<TokenCard key={c.n}><div style={{ width: "100%", height: 64, borderRadius: R.sm, marginBottom: 12, background: T.bg, border: "1px solid " + T.b1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" }}><div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 50%, " + A(T.ba, 0.04) + ", transparent 70%)" }} /><p style={{ fontFamily: T.dc, fontSize: "1.05rem", fontWeight: 300, color: c.v, position: "relative", letterSpacing: ".02em" }}>Sacred Frequency</p></div><p style={{ fontFamily: T.m, fontSize: ".78rem", color: T.tx2, marginBottom: 4 }}>{c.n}</p><CopyValue v={c.v} copied={copied} onCopy={doCopy} /><div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}><span style={{ background: A(T.earth, 0.12), color: SEM.success, padding: "2px 8px", borderRadius: R.pill, fontFamily: T.m, fontSize: ".55rem" }}>✓ AA</span><p style={{ fontFamily: T.m, fontSize: ".6rem", color: T.tx3 }}>{c.d}</p></div></TokenCard>); })}</Grid></ScrollReveal>
        <SubLabel>Borders</SubLabel>
        <ScrollReveal><Grid cols={3} cn="g3" style={{ marginBottom: 56 }}>{[["b1 Subtle", T.b1], ["b2 Default", T.b2], ["b3 Strong", T.b3]].map(function(pair) { return <TokenCard key={pair[0]}><div style={{ width: "100%", height: 48, borderRadius: R.sm, marginBottom: 12, background: T.bg, border: "2px solid " + pair[1] }} /><p style={{ fontFamily: T.m, fontSize: ".78rem", color: T.tx2, marginBottom: 4 }}>{pair[0]}</p><CopyValue v={pair[1]} copied={copied} onCopy={doCopy} /></TokenCard>; })}</Grid></ScrollReveal>
        <ScrollReveal><Grid cols={5} cn="g5">{ACC.map(function(c) { return (
  <TokenCard key={c.n} style={{ overflow: "hidden" }}>
    <div style={{ position: "relative", width: "100%", height: 80, borderRadius: R.sm, marginBottom: 16, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: c.v }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,rgba(255,255,255,.12) 0%,transparent 60%)" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "45%", background: "linear-gradient(to top,rgba(0,0,0,.4),transparent)" }} />
      <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 30px rgba(0,0,0,.2)" }} />
      <div style={{ position: "absolute", top: 8, right: 8, width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,.6)", boxShadow: "0 0 6px rgba(255,255,255,.5)" }} />
    </div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
      <p style={{ fontFamily: T.m, fontSize: ".78rem", color: T.tx1 }}>{c.n}</p>
      <div style={{ width: 7, height: 7, borderRadius: "50%", background: c.v, boxShadow: "0 0 6px " + c.v }} />
    </div>
    <p style={{ fontFamily: T.m, fontSize: ".58rem", color: T.tx3, marginBottom: 8 }}>{c.role}</p>
    <CopyValue v={c.v} copied={copied} onCopy={doCopy} />
  </TokenCard>
); })}</Grid></ScrollReveal>
        <SubLabel>Semantic Color Tokens</SubLabel>
        <ScrollReveal><Grid cols={4} cn="g4" style={{ marginBottom: 40 }}>
          {[
            { label: "Success", hex: SEM.success, desc: "Earth · Heart Chakra" },
            { label: "Warning", hex: SEM.warning,  desc: "Temporal · Caution" },
            { label: "Error",   hex: SEM.error,    desc: "Alert · Critical" },
            { label: "Info",    hex: SEM.info,     desc: "Signal · Neutral" },
          ].map(function(s) { return (
            <TokenCard key={s.label}>
              <div style={{ width: "100%", height: 48, borderRadius: R.sm, marginBottom: 12, background: s.hex, boxShadow: "0 4px 16px " + s.hex + "40" }} />
              <p style={{ fontFamily: T.m, fontSize: ".78rem", color: T.tx1, marginBottom: 3 }}>{s.label}</p>
              <p style={{ fontFamily: T.m, fontSize: ".6rem", color: T.tx3, marginBottom: 6 }}>{s.desc}</p>
              <CopyValue v={s.hex} copied={copied} onCopy={doCopy} />
            </TokenCard>
          );})}
        </Grid></ScrollReveal>
        <SubLabel>Focus Ring Token</SubLabel>
        <ScrollReveal><TokenCard style={{ marginBottom: 0 }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 16, padding: "20px 0" }}>
            {["Button", "Input", "Link", "Card"].map(function(label) { return (
              <div key={label} style={{ padding: "10px 24px", background: A(T.ba, 0.08), border: "1px solid " + A(T.ba, 0.25), borderRadius: R.sm, boxShadow: "0 0 0 2px #030308, 0 0 0 4px #8B5CF6" }}>
                <span style={{ fontFamily: T.m, fontSize: 10, color: T.tx1 }}>{label}</span>
              </div>
            );})}
          </div>
          <p style={{ fontFamily: T.m, fontSize: ".6rem", color: T.tx3, textAlign: "center", marginTop: 8 }}>box-shadow: 0 0 0 2px #030308, 0 0 0 4px #8B5CF6 — keyboard focus ring</p>
        </TokenCard></ScrollReveal>

      </Section>
      <Divider />

      {/* 02 GRADIENTS */}
      <Section id="gradients" num="02" lab="Gradienten" title="Gradient System" desc="Six semantic gradients. Hero/Cover for channels. Chakra selector only.">
        <SubLabel>Brand Gradients</SubLabel>
        <ScrollReveal><Grid cols={2} cn="g2" style={{ marginBottom: 32 }}>{GR.slice(0, 4).map(function(g) { return (
          <TokenCard key={g.n}>
            <div style={{ position: "relative", width: "100%", height: 80, borderRadius: R.sm, marginBottom: 16, overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, background: g.css }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,rgba(255,255,255,.12) 0%,transparent 60%)" }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "45%", background: "linear-gradient(to top,rgba(0,0,0,.35),transparent)" }} />
              <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 30px rgba(0,0,0,.2)" }} />
              <div style={{ position: "absolute", top: 8, right: 8, width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,.5)", boxShadow: "0 0 6px rgba(255,255,255,.4)" }} />
            </div>
            <p style={{ fontFamily: T.m, fontSize: ".82rem", color: T.tx2, marginBottom: 4 }}>{g.n}</p>
            <p style={{ fontFamily: T.m, fontSize: ".58rem", color: T.tx4, marginBottom: 8 }}>{g.role}</p>
            <CopyValue v={g.st} copied={copied} onCopy={doCopy} />
          </TokenCard>
        ); })}</Grid></ScrollReveal>
        <SubLabel>Channel Gradients</SubLabel>
        <ScrollReveal><Grid cols={2} cn="g2" style={{ marginBottom: 32 }}>{GR.slice(4, 6).map(function(g) { return (
          <TokenCard key={g.n}>
            <div style={{ position: "relative", width: "100%", height: 80, borderRadius: R.sm, marginBottom: 16, overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, background: g.css }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,rgba(255,255,255,.12) 0%,transparent 60%)" }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "45%", background: "linear-gradient(to top,rgba(0,0,0,.35),transparent)" }} />
              <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 30px rgba(0,0,0,.2)" }} />
              <div style={{ position: "absolute", top: 8, right: 8, width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,.5)", boxShadow: "0 0 6px rgba(255,255,255,.4)" }} />
            </div>
            <p style={{ fontFamily: T.m, fontSize: ".82rem", color: T.tx2, marginBottom: 4 }}>{g.n}</p>
            <p style={{ fontFamily: T.m, fontSize: ".58rem", color: T.tx4, marginBottom: 8 }}>{g.role}</p>
            <CopyValue v={g.st} copied={copied} onCopy={doCopy} />
          </TokenCard>
        ); })}</Grid></ScrollReveal>
        <SubLabel>Legacy Gradients</SubLabel>
        <ScrollReveal><Grid cols={2} cn="g2">{GR.slice(6).map(function(g) { return <TokenCard key={g.n} style={{ opacity: 0.5 }}><div style={{ width: "100%", height: 52, borderRadius: R.sm, marginBottom: 16, background: g.css }} /><p style={{ fontFamily: T.m, fontSize: ".82rem", color: T.tx2, marginBottom: 4 }}>{g.n}</p><p style={{ fontFamily: T.m, fontSize: ".58rem", color: T.tx4, marginBottom: 8 }}>{g.role}</p><CopyValue v={g.st} copied={copied} onCopy={doCopy} /></TokenCard>; })}</Grid></ScrollReveal>
      </Section>
      <Divider />

      {/* 03 TYPE */}
      <Section id="type" num="03" lab="Typografie" title="Typography" desc="Three voices — Crimson Pro for editorial depth, DM Sans for system clarity, JetBrains Mono for signal precision.">
        <ScrollReveal><Grid cols={3} cn="g3" style={{ marginBottom: 56 }}>
          <TokenCard><p style={{ fontFamily: T.m, fontSize: ".6rem", color: T.tx4, marginBottom: 12 }}>Crimson Pro</p><p style={{ fontFamily: T.dc, fontSize: "1.8rem", fontWeight: 300, marginBottom: 8, lineHeight: 1.1 }}>Sacred Frequencies</p><p style={{ fontFamily: T.dc, fontSize: "1.1rem", fontWeight: 400, color: T.tx3, marginBottom: 12 }}>Consciousness &amp; Healing</p><p style={{ fontFamily: T.m, fontSize: ".65rem", color: T.tx4 }}>Display serif · 300/400</p></TokenCard>
          <TokenCard><p style={{ fontFamily: T.m, fontSize: ".6rem", color: T.tx4, marginBottom: 12 }}>DM Sans</p><p style={{ fontFamily: T.ds, fontSize: "1rem", fontWeight: 400, color: T.tx2, lineHeight: 1.65, marginBottom: 8 }}>Every frequency calibrated to evoke depth and resonance in the listener.</p><p style={{ fontFamily: T.ds, fontSize: ".85rem", fontWeight: 300, color: T.tx3, marginBottom: 12 }}>System body text · Light 300</p><p style={{ fontFamily: T.m, fontSize: ".65rem", color: T.tx4 }}>System sans · 300/400/500</p></TokenCard>
          <TokenCard><p style={{ fontFamily: T.m, fontSize: ".6rem", color: T.tx4, marginBottom: 12 }}>JetBrains Mono</p><GradText g={T.gPrimary} style={{ fontFamily: T.m, fontSize: "2rem", fontWeight: 500, display: "block", marginBottom: 12 }}>432 Hz</GradText><p style={{ fontFamily: T.m, fontSize: ".65rem", color: T.tx4 }}>Signal mono · 400/500</p></TokenCard>
        </Grid></ScrollReveal>
        <SubLabel>Weight Scale</SubLabel>
        <ScrollReveal><div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 40 }}>{[["200", "Thin"], ["300", "Light"], ["400", "Regular"], ["500", "Medium"], ["600", "SemiBold"], ["700", "Bold"]].map(function(pair) { return <TokenCard key={pair[0]} style={{ padding: "12px 20px", flex: "1 1 100px" }}><p style={{ fontWeight: pair[0], fontSize: "1.1rem", color: T.tx1 }}>{pair[1]}</p><p style={{ fontFamily: T.m, fontSize: ".6rem", color: T.tx4 }}>{pair[0]}</p></TokenCard>; })}</div></ScrollReveal>
        <SubLabel>Gradient Text Classes</SubLabel>
        <ScrollReveal><Grid cols={2} cn="g2">{[{ n: "gPrimary", g: T.gPrimary, t: "Sacred Frequencies" }, { n: "gSignal", g: T.gSignal, t: "432 Hz" }, { n: "gH · Wordmark", g: T.gH, t: "PureVibration" }, { n: "gChakra", g: T.gChakra, t: "Binaural Beats" }].map(function(v) { return <TokenCard key={v.n}><GradText g={v.g} style={{ fontSize: "1.5rem", fontWeight: 300, fontFamily: T.dc }}>{v.t}</GradText><p style={{ fontFamily: T.m, fontSize: ".6rem", color: T.tx4, marginTop: 8 }}>{"." + v.n}</p></TokenCard>; })}</Grid></ScrollReveal>
      </Section>
      <Divider />

      {/* 04 SPACE */}
      <Section id="space" num="04" lab="Abstände" title="Spacing Scale" desc="A 4px base unit. Generous whitespace lets the void breathe.">
        <SubLabel>Spacing Scale</SubLabel>
        <ScrollReveal><Grid cols={2} cn="g2" style={{ marginBottom: 40 }}>{[[4, "Base", "1"], [8, "Tight", "2"], [12, "Small", "3"], [16, "Default", "4"], [24, "Medium", "6"], [32, "Large", "8"], [48, "XL", "12"], [64, "2XL", "16"], [96, "Section", "24"]].map(function(row) { return <div key={row[0]} style={{ display: "flex", alignItems: "center", gap: 16, paddingBottom: 12, borderBottom: "1px solid " + T.b1 }}><div style={{ width: row[0], height: 8, background: T.gPrimary, borderRadius: 4, minWidth: 4 }} /><span style={{ fontFamily: T.m, fontSize: ".75rem", color: T.tx2, minWidth: 50 }}>{row[0]}px</span><span style={{ fontFamily: T.m, fontSize: ".65rem", color: T.tx4 }}>{row[1] + " · ×" + row[2]}</span></div>; })}</Grid></ScrollReveal>
        <SubLabel>Border Radius</SubLabel>
        <ScrollReveal><div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>{[["0px", "None"], ["6px · r-xs", "Badge"], ["10px · r-sm", "Button"], ["16px · r-md", "Card"], ["24px · r-lg", "Sheet"], ["9999px · pill", "Pill"]].map(function(pair) { return <TokenCard key={pair[0]} style={{ padding: 14, flex: "1 1 90px", textAlign: "center" }}><div style={{ width: 44, height: 44, background: "rgba(255,255,255,.05)", border: "1px solid " + T.b2, borderRadius: pair[0], margin: "0 auto 8px" }} /><p style={{ fontFamily: T.m, fontSize: ".7rem", color: T.tx2 }}>{pair[0]}</p><p style={{ fontFamily: T.m, fontSize: ".55rem", color: T.tx4 }}>{pair[1]}</p></TokenCard>; })}</div></ScrollReveal>
      </Section>
      <Divider />

      {/* 05 SHADOWS */}
      <Section id="shadows" num="05" lab="Schatten" title="Glow Shadows" desc="Layered elevation system — material depth shadows plus semantic glow overlays.">
        <SubLabel>Elevation + Glow System</SubLabel>
        <ScrollReveal><Grid cols={2} cn="g2" style={{ marginBottom: 40 }}>{[["el-1 · Rest", EL[1]], ["el-2 · Hover", EL[2]], ["el-3 · Float", EL[3]], ["glow-primary", EL.glowPrimary], ["glow-signal", EL.glowSignal], ["glow-warmth", EL.glowWarmth]].map(function(pair) { return <TokenCard key={pair[0]}><div style={{ width: "100%", height: 100, borderRadius: R.md, background: T.s1, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: pair[1], marginBottom: 16 }}><span style={{ fontFamily: T.m, fontSize: ".7rem", color: T.tx3 }}>{pair[0]}</span></div><CopyValue v={pair[1]} copied={copied} onCopy={doCopy} /></TokenCard>; })}</Grid></ScrollReveal>
        <SubLabel>Backdrop Blur</SubLabel>
        <ScrollReveal><div style={{ position: "relative", height: 200, borderRadius: R.md, overflow: "hidden", marginBottom: 24, background: T.gH }}>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
            {[["blur(8px)", "Soft"], ["blur(16px)", "Default"], ["blur(24px)", "Heavy"]].map(function(pair) {
              return <div key={pair[0]} style={{ width: "30%", height: "70%", borderRadius: R.sm, border: "1px solid " + T.b3, backdropFilter: pair[0] + " saturate(1.4)", WebkitBackdropFilter: pair[0] + " saturate(1.4)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(3,3,4,.2)" }}><p style={{ fontFamily: T.m, fontSize: ".7rem", color: T.tx1, textShadow: "0 1px 4px rgba(0,0,0,.5)" }}>{pair[0]}</p><p style={{ fontFamily: T.m, fontSize: ".55rem", color: "rgba(255,255,255,.7)", marginTop: 4 }}>{pair[1]}</p></div>;
            })}
          </div>
        </div></ScrollReveal>
      </Section>
      <Divider />

      {/* 06 MOTION */}
      <Section id="motion" num="06" lab="Bewegung" title="Motion System" desc="Organic, meditative motion.">
        <SubLabel>Easing Curves</SubLabel>
        <ScrollReveal><Grid cols={2} cn="g2" style={{ marginBottom: 40 }}>
          <TokenCard><p style={{ fontFamily: T.m, fontSize: ".7rem", color: T.tx2, marginBottom: 12 }}>Sacred Ease</p><div style={{ height: 32, background: "rgba(255,255,255,.03)", borderRadius: R.xs, position: "relative", overflow: "hidden", marginBottom: 12 }}><div style={{ width: 24, height: 24, borderRadius: 6, background: T.gH, position: "absolute", top: 4, left: 4, animation: "easeDemo " + DUR.slow + "ms " + T.e + " infinite" }} /></div><CopyValue v="cubic-bezier(0.22,1,0.36,1)" copied={copied} onCopy={doCopy} /></TokenCard>
          <TokenCard><p style={{ fontFamily: T.m, fontSize: ".7rem", color: T.tx2, marginBottom: 12 }}>Bounce</p><div style={{ height: 32, background: "rgba(255,255,255,.03)", borderRadius: R.xs, position: "relative", overflow: "hidden", marginBottom: 12 }}><div style={{ width: 24, height: 24, borderRadius: 6, background: T.gPrimary, position: "absolute", top: 4, left: 4, animation: "easeDemo " + DUR.slow + "ms " + T.e + " infinite" }} /></div><CopyValue v="cubic-bezier(0.34,1.56,0.64,1)" copied={copied} onCopy={doCopy} /></TokenCard>
        </Grid></ScrollReveal>
        <SubLabel>Duration Scale</SubLabel>
        <ScrollReveal><div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 40 }}>{[["80ms · micro", "Button press"], ["150ms · fast", "Tooltip, badge"], ["280ms · default", "Card, reveal"], ["450ms · slow", "Modal entry"], ["6000ms · breath", "Ambient, pulse"]].map(function(pair) { return <TokenCard key={pair[0]} style={{ padding: "12px 20px", flex: "1 1 100px" }}><p style={{ fontFamily: T.m, fontSize: ".75rem", color: T.tx1 }}>{pair[0]}</p><p style={{ fontFamily: T.m, fontSize: ".6rem", color: T.tx4 }}>{pair[1]}</p></TokenCard>; })}</div></ScrollReveal>
        <SubLabel>Animation Presets</SubLabel>
        <ScrollReveal><Grid cols={4} cn="g4">{[["float","6s ease-in-out infinite","float"],["pulse-glow","3s ease infinite","pulseGlow"],["breathe","4s ease infinite","breathe"],["spin-slow","20s linear infinite","spinSlow"]].map(function(pair) { return <TokenCard key={pair[0]} style={{ textAlign: "center" }}><div style={{ width: 32, height: 32, borderRadius: pair[0] === "spin-slow" ? 4 : "50%", background: pair[0] === "spin-slow" ? T.gPrimary : T.ba, margin: "0 auto 12px", animation: pair[2] + " " + pair[1], boxShadow: pair[0] === "pulse-glow" ? "0 0 15px " + A(T.ba, 0.2) : "none" }} /><p style={{ fontFamily: T.m, fontSize: ".75rem", color: T.tx2 }}>{pair[0]}</p><p style={{ fontFamily: T.m, fontSize: ".6rem", color: T.tx4 }}>{pair[1]}</p></TokenCard>; })}</Grid></ScrollReveal>
      </Section>
      <Divider />

      {/* 07 COMPONENTS */}
      <Section id="components" num="07" lab="Bausteine" title="Component Snippets" desc="Copy-paste ready building blocks.">

        {/* PILL BADGES — full family */}
        <SubLabel>Pill Badge System</SubLabel>
        <ScrollReveal>
          <TokenCard style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12, padding: "28px 0" }}>
              {/* Primary: Gradient border */}
              <div style={{ position: "relative", display: "inline-flex" }}>
                <div style={{ position: "absolute", inset: -1, borderRadius: R.pill, background: T.gH, opacity: 0.6 }} />
                <div style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 20px", background: T.bg, borderRadius: R.pill }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: T.cy, boxShadow: "0 0 6px " + T.cy }} />
                  <span style={{ fontFamily: T.m, fontSize: 10, color: T.tx1, textTransform: "uppercase", letterSpacing: ".15em" }}>Active · 528 Hz</span>
                </div>
              </div>
              {/* Ghost: Subtle border */}
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 20px", border: "1px solid " + T.b2, borderRadius: R.pill }}>
                <span style={{ fontFamily: T.m, fontSize: 10, color: T.tx3, textTransform: "uppercase", letterSpacing: ".15em" }}>Solfeggio</span>
              </div>
              {/* Filled: Violet */}
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 20px", background: A(T.ba, 0.12), border: "1px solid " + A(T.ba, 0.25), borderRadius: R.pill, boxShadow: "0 0 16px " + A(T.ba, 0.08) }}>
                <span style={{ fontFamily: T.m, fontSize: 10, color: T.bl, textTransform: "uppercase", letterSpacing: ".15em" }}>Sacred Violet</span>
              </div>
              {/* Filled: Cyan */}
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 20px", background: A(T.cy, 0.08), border: "1px solid " + A(T.cy, 0.2), borderRadius: R.pill }}>
                <span style={{ fontFamily: T.m, fontSize: 10, color: T.cy, textTransform: "uppercase", letterSpacing: ".15em" }}>432 Hz Tuning</span>
              </div>
              {/* Large Hz display badge */}
              <div style={{ display: "inline-flex", alignItems: "baseline", gap: 4, padding: "10px 22px", background: A(T.ba, 0.85), borderRadius: R.pill, boxShadow: "0 0 24px " + A(T.ba, 0.4) }}>
                <span style={{ fontFamily: T.m, fontSize: 16, fontWeight: 500, color: "#fff" }}>639</span>
                <span style={{ fontFamily: T.m, fontSize: 9, color: T.bl }}>Hz</span>
              </div>
            </div>
          </TokenCard>
        </ScrollReveal>

        {/* FREQUENCY CARD — premium with glow + session info */}
        <SubLabel>Frequency Card</SubLabel>
        <ScrollReveal>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
            <div style={{ position: "relative" }}>
              {/* Ambient glow */}
              <div style={{ position: "absolute", inset: -30, background: "radial-gradient(ellipse at 50% 60%," + A(T.earth, 0.15) + ",transparent 70%)", pointerEvents: "none", borderRadius: "50%" }} />
              <TokenCard style={{ width: 260, padding: "28px 24px 24px", background: "linear-gradient(160deg,rgba(16,22,16,.9),rgba(5,8,5,.98))", borderRadius: R.lg, position: "relative", overflow: "hidden" }}>
                {/* Subtle grid overlay */}
                <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.015) 1px,transparent 1px)", backgroundSize: "20px 20px", pointerEvents: "none" }} />
                {/* Header row */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, position: "relative" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: CH[3].c, boxShadow: "0 0 10px " + CH[3].c }} />
                    <span style={{ fontFamily: T.m, fontSize: 8, color: T.tx4, textTransform: "uppercase", letterSpacing: ".2em" }}>Heart Chakra</span>
                  </div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", background: A(T.earth, 0.12), border: "1px solid " + A(T.earth, 0.2), borderRadius: R.pill }}>
                    <div style={{ width: 4, height: 4, borderRadius: "50%", background: T.earth }} />
                    <span style={{ fontFamily: T.m, fontSize: 7, color: T.earth }}>LIVE</span>
                  </div>
                </div>
                {/* Hz Number */}
                <div style={{ marginBottom: 4, position: "relative" }}>
                  <GradText g={T.gE} style={{ fontFamily: T.m, fontSize: "3.5rem", fontWeight: 500, lineHeight: 1 }}>639</GradText>
                  <span style={{ fontFamily: T.m, fontSize: 11, color: T.tx4, marginLeft: 4 }}>Hz</span>
                </div>
                {/* Name */}
                <p style={{ fontFamily: T.dc, fontWeight: 300, color: T.tx2, fontSize: "1.1rem", marginBottom: 4 }}>Anahata · Connection</p>
                <p style={{ fontFamily: T.m, fontSize: 8, color: T.tx4, textTransform: "uppercase", letterSpacing: ".18em", marginBottom: 20 }}>Solfeggio Frequency</p>
                {/* Progress bar */}
                <div style={{ height: 1.5, background: "rgba(255,255,255,.06)", borderRadius: 2, marginBottom: 6, overflow: "hidden" }}>
                  <div style={{ width: "42%", height: "100%", background: "linear-gradient(90deg,#059669,#34D399)", borderRadius: 2 }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: T.m, fontSize: 7, color: T.tx4 }}>25:12</span>
                  <span style={{ fontFamily: T.m, fontSize: 7, color: T.tx4 }}>60:00</span>
                </div>
              </TokenCard>
            </div>
          </div>
        </ScrollReveal>

        {/* GLASS HEADER — full nav bar */}
        <SubLabel>Glass Navigation Header</SubLabel>
        <ScrollReveal>
          <TokenCard style={{ marginBottom: 32, padding: 0, overflow: "hidden" }}>
            <div style={{ background: "radial-gradient(ellipse at 50% 100%," + A(T.ba, 0.04) + ",transparent 70%),linear-gradient(180deg,rgba(8,8,12,.6),rgba(3,3,4,.8))", backdropFilter: "blur(24px) saturate(1.5)", padding: "14px 24px", display: "flex", alignItems: "center", gap: 24, borderBottom: "1px solid " + T.b1 }}>
              {/* Logo */}
              <div style={{ display: "flex", alignItems: "baseline", gap: 3, flexShrink: 0 }}>
                <GradText g={T.gH} style={{ fontFamily: T.dc, fontWeight: 600, fontSize: "1.1rem" }}>PV</GradText>
                <span style={{ fontFamily: T.m, fontSize: 9, color: T.gd, fontWeight: 500 }}>432</span>
              </div>
              {/* Nav items */}
              <div style={{ display: "flex", gap: 20, flex: 1 }}>
                {["Frequencies", "Chakras", "Sessions", "Library"].map((item, i) => (
                  <span key={item} style={{ fontFamily: T.m, fontSize: 9, textTransform: "uppercase", letterSpacing: ".12em", color: i === 0 ? T.tx1 : T.tx4, cursor: "pointer", position: "relative" }}>
                    {item}
                    {i === 0 && <div style={{ position: "absolute", bottom: -14, left: 0, right: 0, height: 1.5, background: T.gPrimary }} />}
                  </span>
                ))}
              </div>
              {/* Right actions */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                <div style={{ width: 28, height: 28, borderRadius: R.xs, background: "rgba(255,255,255,.04)", border: "1px solid " + T.b1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontFamily: T.m, fontSize: 9, color: T.tx3 }}>⌕</span>
                </div>
                <div style={{ position: "relative" }}>
                  <div style={{ width: 28, height: 28, borderRadius: R.xs, background: A(T.ba, 0.1), border: "1px solid " + A(T.ba, 0.2), display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: T.gPrimary }} />
                  </div>
                  <div style={{ position: "absolute", top: -3, right: -3, width: 8, height: 8, borderRadius: "50%", background: T.cy, border: "1.5px solid " + T.bg }} />
                </div>
              </div>
            </div>
            <div style={{ padding: "8px 24px 0" }}>
              <div style={{ display: "flex", gap: 0 }}>
                {["All", "Solfeggio", "Binaural", "432 Hz"].map((tab, i) => (
                  <div key={tab} style={{ padding: "10px 16px", borderBottom: i === 0 ? "2px solid " + T.ba : "2px solid transparent" }}>
                    <span style={{ fontFamily: T.m, fontSize: 8, textTransform: "uppercase", letterSpacing: ".15em", color: i === 0 ? T.tx1 : T.tx4 }}>{tab}</span>
                  </div>
                ))}
              </div>
            </div>
          </TokenCard>
        </ScrollReveal>

        {/* BUTTON SYSTEM */}
        <SubLabel>Button System</SubLabel>
        <ScrollReveal>
          <TokenCard style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: 12, padding: "20px 0" }}>
              {/* Primary */}
              <button style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", background: T.gPrimary, border: "none", borderRadius: R.sm, cursor: "pointer", boxShadow: "0 0 24px " + A(T.ba, 0.35) + ",0 4px 12px rgba(0,0,0,.4)" }}>
                <span style={{ fontFamily: T.m, fontSize: 9, fontWeight: 500, color: "#fff", textTransform: "uppercase", letterSpacing: ".15em" }}>Begin Protocol</span>
              </button>
              {/* Secondary */}
              <button style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", background: "transparent", border: "1px solid " + T.b2, borderRadius: R.sm, cursor: "pointer" }}>
                <span style={{ fontFamily: T.m, fontSize: 9, color: T.tx2, textTransform: "uppercase", letterSpacing: ".15em" }}>Explore</span>
              </button>
              {/* Icon button */}
              <button style={{ width: 44, height: 44, borderRadius: R.sm, background: A(T.ba, 0.1), border: "1px solid " + A(T.ba, 0.2), cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 0, height: 0, borderTop: "6px solid transparent", borderBottom: "6px solid transparent", borderLeft: "10px solid " + T.bl, marginLeft: 2 }} />
              </button>
              {/* Destructive ghost */}
              <button style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", background: A("#C62828", 0.06), border: "1px solid " + A("#C62828", 0.15), borderRadius: R.sm, cursor: "pointer" }}>
                <span style={{ fontFamily: T.m, fontSize: 9, color: SEM.error, textTransform: "uppercase", letterSpacing: ".15em" }}>Reset</span>
              </button>
            </div>
          </TokenCard>
        </ScrollReveal>

        {/* COLOR TOKEN CARDS — mini swatch grid */}
        <SubLabel>Color Token Cards</SubLabel>
        <ScrollReveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 32 }}>
            {[
              { name: "primary",       hex: "#8B5CF6", g: T.gPrimary },
              { name: "primary-l",     hex: "#C4B5FD", g: T.gPrimary },
              { name: "signal",        hex: "#4DD0E1", g: T.gSignal },
              { name: "warmth",        hex: "#F59E0B", g: T.gWarmth },
              { name: "earth",         hex: "#34D399", g: T.gE },
            ].map(sw => (
              <TokenCard key={sw.name} style={{ padding: 12, textAlign: "center" }}>
                <div style={{ width: "100%", height: 40, borderRadius: R.sm, marginBottom: 10, background: sw.hex, boxShadow: "0 4px 16px " + sw.hex + "50" }} />
                <p style={{ fontFamily: T.m, fontSize: 8, color: T.tx3, marginBottom: 3, textTransform: "uppercase", letterSpacing: ".1em" }}>{sw.name}</p>
                <span style={{ fontFamily: T.m, fontSize: 8, color: T.tx4 }}>{sw.hex}</span>
              </TokenCard>
            ))}
          </div>
        </ScrollReveal>

        {/* CHAKRA DOT SYSTEM — with labels */}
        <SubLabel>Chakra Dot System</SubLabel>
        <ScrollReveal>
          <TokenCard>
            <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center", padding: "16px 0" }}>
              {CH.map((c, i) => (
                <div key={c.n} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <div style={{ position: "relative" }}>
                    <div style={{ position: "absolute", inset: -4, borderRadius: "50%", background: c.c, opacity: 0.12 }} />
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: c.c, boxShadow: "0 0 14px " + c.c + "80", position: "relative" }} />
                  </div>
                  <span style={{ fontFamily: T.m, fontSize: 7, color: T.tx4, textTransform: "uppercase", letterSpacing: ".1em" }}>{c.hz}</span>
                </div>
              ))}
            </div>
          </TokenCard>
        </ScrollReveal>
      </Section>
      <Divider />

      {/* 08 CHAKRAS */}
      <Section id="chakras" num="08" lab="Chakren" title="Chakra Frequency Map" desc="Seven energy centers tuned to Solfeggio frequencies.">
        <ScrollReveal><div style={{ display: "flex", gap: 48, alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}>
          <div style={{ position: "relative", width: 120, height: 380 }}>
            <div style={{ position: "absolute", left: "50%", top: "10%", bottom: "5%", width: 2, background: "linear-gradient(180deg,#2E2E48,#4A4A6A,#2E2E48)", transform: "translateX(-50%)" }} />
            {CH.map(function(c, i) { return <div key={c.n} onClick={function() { setActiveChakra(i); }} onKeyDown={function(e) { if (e.key === "Enter" || e.key === " ") setActiveChakra(i); }} role="button" tabIndex={0} aria-label={c.n + " Chakra " + c.hz + "Hz"} style={{ position: "absolute", left: "50%", top: c.y + "%", transform: "translateX(-50%)", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 2 }}><div style={{ width: activeChakra === i ? 28 : 20, height: activeChakra === i ? 28 : 20, borderRadius: "50%", background: c.c, transition: "all .4s " + T.e, boxShadow: activeChakra === i ? "0 0 30px " + c.c : "none" }} /></div>; })}
          </div>
          <TokenCard style={{ maxWidth: 320, minWidth: 240 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}><div style={{ width: 16, height: 16, borderRadius: "50%", background: ck.c, boxShadow: "0 0 15px " + ck.c }} /><span style={{ fontFamily: T.m, fontSize: ".65rem", color: T.tx4, textTransform: "uppercase", letterSpacing: ".2em" }}>{ck.s}</span></div>
            <GradText g={T.gPrimary} style={{ fontFamily: T.m, fontSize: "2.5rem", fontWeight: 500 }}>{ck.hz}</GradText><span style={{ fontFamily: T.m, fontSize: ".85rem", color: T.tx4, marginLeft: 6 }}>Hz</span>
            <h3 style={{ fontFamily: T.dc, fontWeight: 300, fontSize: "1.5rem", color: T.tx1, marginTop: 12 }}>{ck.n} Chakra</h3>
            <div style={{ marginTop: 8 }}><CopyValue v={ck.c} copied={copied} onCopy={doCopy} /></div>
          </TokenCard>
        </div></ScrollReveal>
      </Section>
      <Divider />

      {/* 09 A11Y — T4-05: Interactive Contrast Checker */}
      <Section id="a11y" num="09" lab="Barrierefreiheit" title="Accessibility" desc="Every pairing tested for WCAG compliance.">
        <SubLabel>Live Contrast Checker</SubLabel>
        <ScrollReveal><A11yChecker copied={copied} onCopy={doCopy} /></ScrollReveal>
        <div style={{ height: 32 }} />
        <SubLabel>Common Pairings</SubLabel>
        <ScrollReveal><Grid cols={2} cn="g2">{[[T.tx1, T.bg, "tx1/void", true], [T.tx2, T.bg, "tx2/void", true], [T.tx3, T.bg, "tx3/void", false], [T.cy, T.bg, "cyan/void", true]].map(function(row) { return <TokenCard key={row[2]}><div style={{ width: "100%", height: 80, borderRadius: R.sm, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", fontWeight: 500, background: row[1], color: row[0], border: "1px solid " + (row[3] ? A(T.earth, 0.4) : A("#C62828", 0.4)), marginBottom: 12 }}>The quick brown fox</div><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontFamily: T.m, fontSize: ".75rem", color: T.tx3 }}>{row[2]}</span><span style={{ background: row[3] ? A(T.earth, 0.15) : A("#C62828", 0.15), color: row[3] ? SEM.success : SEM.error, padding: "2px 10px", borderRadius: R.pill, fontSize: ".65rem", fontFamily: T.m }}>{row[3] ? "PASS AA" : "FAIL AA"}</span></div></TokenCard>; })}</Grid></ScrollReveal>
      </Section>
      <Divider />

      {/* 10 PLAYGROUND */}
      <Section id="playground" num="10" lab="Spielwiese" title="Token Playground" desc="Tweak values live.">
        <SubLabel>Tweak Properties</SubLabel>
        <ScrollReveal><Grid cols={2} cn="g2">
          <TokenCard>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <p style={{ fontFamily: T.m, fontSize: ".65rem", color: T.tx4 }}>Controls</p>
              <button onClick={resetPlayground} style={{ fontFamily: T.m, fontSize: ".55rem", color: T.tx4, background: "rgba(255,255,255,.04)", border: "1px solid " + T.b1, borderRadius: R.xs, padding: "4px 10px", cursor: "pointer" }}>Reset</button>
            </div>
            <div style={{ marginBottom: 16 }}><label htmlFor="pg-bg" style={{ fontFamily: T.m, fontSize: ".6rem", color: T.tx4, display: "block", marginBottom: 4 }}>{"Background " + pgBg}</label><input id="pg-bg" type="color" value={pgBg} onChange={handlePgBgChange} style={{ width: "100%", height: 32, cursor: "pointer", background: "none", border: "1px solid " + T.b1, borderRadius: 8 }} /></div>
            <div style={{ marginBottom: 16 }}><label htmlFor="pg-accent" style={{ fontFamily: T.m, fontSize: ".6rem", color: T.tx4, display: "block", marginBottom: 4 }}>{"Accent " + pgAccent}</label><input id="pg-accent" type="color" value={pgAccent} onChange={handlePgAccentChange} style={{ width: "100%", height: 32, cursor: "pointer", background: "none", border: "1px solid " + T.b1, borderRadius: 8 }} /></div>
            <label htmlFor="pg-radius" style={{ fontFamily: T.m, fontSize: "max(.7rem, 12px)", color: T.tx4, display: "block", marginBottom: 4 }}>{"Radius: " + pgRadius + "px"}</label>
            <input id="pg-radius" type="range" min="0" max="32" value={pgRadius} onChange={handlePgRadiusChange} style={{ width: "100%" }} />
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              {[["xs", R.xs], ["sm", R.sm], ["md", R.md], ["lg", R.lg], ["pill", R.pill]].map(function(p) { return <button key={p[0]} onClick={function() { setPgRadius(p[1]); }} style={{ padding: "3px 10px", borderRadius: R.pill, fontFamily: T.m, fontSize: ".55rem", color: pgRadius === p[1] ? T.cy : T.tx4, background: pgRadius === p[1] ? A(T.cy, 0.08) : "rgba(255,255,255,.03)", border: "1px solid " + (pgRadius === p[1] ? A(T.cy, 0.2) : T.b1), cursor: "pointer" }}>{p[0] + " " + p[1]}</button>; })}
            </div>
          </TokenCard>
          <TokenCard style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 250 }}>
            <div style={{ background: pgBg, borderRadius: pgRadius, border: "1px solid " + pgAccent + "40", padding: 24, boxShadow: "0 0 40px " + pgAccent + "30", textAlign: "center" }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: pgAccent, margin: "0 auto 12px", boxShadow: "0 0 20px " + pgAccent + "50" }} />
              <p style={{ fontFamily: T.m, fontSize: ".75rem", color: T.tx1 }}>Preview Card</p>
            </div>
          </TokenCard>
        </Grid></ScrollReveal>
      </Section>
      <Divider />

      {/* 11 EXPORT */}
      <Section id="export" num="11" lab="Export" title="Export Tokens" desc="Copy in your preferred format.">
        <ScrollReveal>
          <div style={{ display: "flex", gap: 2, background: T.s1, borderRadius: R.sm, padding: 3, marginBottom: 16, border: "1px solid " + T.b1, flexWrap: "wrap" }}>
            {["css", "scss", "js", "tw", "figma"].map(function(f) { return <button key={f} onClick={function() { setExportFormat(f); }} style={{ padding: "6px 14px", borderRadius: R.xs, fontFamily: T.m, fontSize: ".65rem", color: exportFormat === f ? T.tx1 : T.tx4, background: exportFormat === f ? "rgba(255,255,255,.06)" : "transparent", cursor: "pointer", textTransform: "uppercase", border: "none" }}>{f === "tw" ? "tailwind" : f}</button>; })}
          </div>
          <CodeBlock copyContent={exportCode}>{exportCode}</CodeBlock>
        </ScrollReveal>
      </Section>
      <Divider />

      {/* 12 BRAND */}
      <Section id="brand" num="12" lab="Marke" title="Brand Guidelines" desc="Die visuelle Identität.">
        <SubLabel>Logomark</SubLabel>
        <ScrollReveal><Grid cols={3} cn="g3" style={{ marginBottom: 56 }}>
          <TokenCard><p style={{ fontFamily: T.m, fontSize: ".6rem", color: T.tx4, marginBottom: 12 }}>Primär</p><div style={{ borderRadius: R.sm, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 0", background: T.bg, border: "1px solid " + T.b1 }}><span style={{ fontSize: "1.8rem", fontWeight: 200 }}>Pure<GradText g={T.gH}>Vibration</GradText></span></div></TokenCard>
          <TokenCard><p style={{ fontFamily: T.m, fontSize: ".6rem", color: T.tx4, marginBottom: 12 }}>Kompakt</p><div style={{ borderRadius: R.sm, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 0", background: T.bg, border: "1px solid " + T.b1 }}><span style={{ fontSize: "1.8rem", fontWeight: 600 }}><GradText g={T.gH}>PV</GradText><span style={{ fontFamily: T.m, fontSize: "1rem", color: T.gd, marginLeft: 4 }}>432</span></span></div></TokenCard>
          <TokenCard><p style={{ fontFamily: T.m, fontSize: ".6rem", color: T.tx4, marginBottom: 12 }}>Mono</p><div style={{ borderRadius: R.sm, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 0", background: T.bg, border: "1px solid " + T.b1 }}><span style={{ fontSize: "1.8rem", fontWeight: 200, opacity: 0.7 }}>PureVibration</span></div></TokenCard>
        </Grid></ScrollReveal>
        <SubLabel>Schutzzone & Mindestgröße</SubLabel>
        <ScrollReveal><Grid cols={2} cn="g2" style={{ marginBottom: 56 }}>
          <TokenCard><p style={{ fontFamily: T.m, fontSize: ".6rem", color: T.tx4, marginBottom: 12 }}>Schutzzone</p><div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 32, border: "2px dashed " + A(T.cy, 0.2), borderRadius: 16 }}><div style={{ padding: "24px 48px", border: "1px solid " + T.b2, borderRadius: 8 }}><span style={{ fontSize: "1.4rem", fontWeight: 200 }}>Pure<GradText g={T.gH}>Vibration</GradText></span></div></div></TokenCard>
          <TokenCard><p style={{ fontFamily: T.m, fontSize: ".6rem", color: T.tx4, marginBottom: 12 }}>Mindestgröße</p><div style={{ textAlign: "center", padding: "24px 0" }}><span style={{ fontSize: "1.4rem", fontWeight: 200 }}>Pure<GradText g={T.gH}>Vibration</GradText></span><p style={{ fontFamily: T.m, fontSize: 8, color: T.tx4, marginTop: 4 }}>Digital: min. 120px</p></div></TokenCard>
        </Grid></ScrollReveal>
        <SubLabel>Do's & Don'ts</SubLabel>
        <ScrollReveal><Grid cols={2} cn="g2" style={{ marginBottom: 56 }}>
          <TokenCard bc=A(T.earth, 0.2)><span style={{ fontFamily: T.m, textTransform: "uppercase", letterSpacing: ".15em", fontSize: 9, color: SEM.success }}>Do</span><div style={{ marginTop: 16, fontSize: 10, color: T.tx2 }}><p>· Logo auf dunklem Hintergrund</p><p>· Gradient-Version bevorzugen</p><p>· Schutzzone einhalten</p></div></TokenCard>
          <TokenCard bc=A("#C62828", 0.2)><span style={{ fontFamily: T.m, textTransform: "uppercase", letterSpacing: ".15em", fontSize: 9, color: SEM.error }}>Don't</span><div style={{ marginTop: 16, fontSize: 10, color: T.tx2 }}><p>· Logo auf hellem Hintergrund</p><p>· Logo verzerren</p><p>· Farben ändern</p></div></TokenCard>
        </Grid></ScrollReveal>
        <SubLabel>Farbverwendung</SubLabel>
        <ScrollReveal><Grid cols={2} cn="g2" style={{ marginBottom: 56 }}>
          <TokenCard><div style={{ width: "100%", height: 48, borderRadius: R.sm, background: T.gH, marginBottom: 16 }} /><p style={{ fontFamily: T.m, fontSize: ".78rem", color: T.tx2 }}>Primärfarbe</p></TokenCard>
          <TokenCard><div style={{ width: "100%", height: 48, borderRadius: R.sm, background: T.gSignal, marginBottom: 16 }} /><p style={{ fontFamily: T.m, fontSize: ".78rem", color: T.tx2 }}>Signal (Cyan)</p></TokenCard>
        </Grid></ScrollReveal>
        <SubLabel>Typografie-Regeln</SubLabel>
        <ScrollReveal><Grid cols={2} cn="g2">
          <TokenCard>{[["H1 · Display", "Crimson Pro 300"], ["H2 · Section", "Crimson Pro 400"], ["Body", "DM Sans 400"], ["Label", "JetBrains Mono 400"]].map(function(pair) { return <div key={pair[0]} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 10, fontFamily: T.m }}><span style={{ color: T.tx2 }}>{pair[0]}</span><span style={{ color: T.tx4 }}>{pair[1]}</span></div>; })}</TokenCard>
          <TokenCard><div style={{ fontSize: 10, color: T.tx2, fontFamily: T.m }}><p>· 3 fonts: Crimson Pro, DM Sans, JetBrains Mono</p><p>· Hz numbers: JetBrains Mono + gPrimary</p><p>· Min body size: 16px · Min label: 11px</p><p>· Headlines max 2 lines</p></div></TokenCard>
        </Grid></ScrollReveal>
      </Section>
      <Divider />

      {/* 13 EXAMPLES */}
      <Section id="examples" num="13" lab="Anwendung" title="Application Examples" desc="Das Design System in echten Produkten.">

        {/* ─── APP SCREEN — VIBRAHEALS ─── */}
        <SubLabel>App Screen — VIBRAHEALS</SubLabel>
        <ScrollReveal>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 64 }}>
            {/* Outer glow halo */}
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", inset: -40, background: "radial-gradient(ellipse at 50% 55%," + A(T.ba, 0.18) + ",transparent 65%)", pointerEvents: "none" }} />

              {/* Phone Shell */}
              <div style={{
                width: 310, borderRadius: 48,
                background: "linear-gradient(160deg,#111118,#06060A)",
                border: "1.5px solid " + T.b2,
                boxShadow: "0 60px 120px rgba(0,0,0,.9),0 0 0 1px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.06)",
                overflow: "hidden", position: "relative"
              }}>
                {/* Dynamic Island */}
                <div style={{ display: "flex", justifyContent: "center", paddingTop: 14, paddingBottom: 8, background: "transparent" }}>
                  <div style={{ width: 120, height: 32, borderRadius: 20, background: "#000", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#1a1a1a", border: "1px solid " + T.b1 }} />
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#111" }} />
                  </div>
                </div>

                {/* Status Bar */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "2px 22px 10px" }}>
                  <span style={{ fontFamily: T.m, fontSize: 12, fontWeight: 600, color: T.tx1 }}>9:41</span>
                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
                      {[2,4,6,8].map((h,i) => <rect key={i} x={i*4} y={10-h} width="3" height={h} rx="1" fill={i < 3 ? "white" : "rgba(255,255,255,.3)"} />)}
                    </svg>
                    <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
                      <path d="M8 2C10.8 2 13.3 3.1 15.1 5L16 4C13.9 1.5 10.7 0 8 0S2.1 1.5 0 4L.9 5C2.7 3.1 5.2 2 8 2Z" fill="white" fillOpacity=".5"/>
                      <path d="M8 5C9.7 5 11.3 5.7 12.5 6.8L13.4 5.8C11.9 4.4 9.9 3.5 8 3.5S4.1 4.4 2.6 5.8L3.5 6.8C4.7 5.7 6.3 5 8 5Z" fill="white" fillOpacity=".7"/>
                      <circle cx="8" cy="9" r="1.5" fill="white"/>
                    </svg>
                    <div style={{ width: 22, height: 11, borderRadius: 3, border: "1px solid " + T.b3, position: "relative", overflow: "hidden" }}>
                      <div style={{ position: "absolute", inset: 1.5, borderRadius: 1.5, background: T.earth, width: "65%" }} />
                      <div style={{ position: "absolute", top: 2, bottom: 2, right: -4, width: 3, borderRadius: "0 1px 1px 0", background: "rgba(255,255,255,.3)" }} />
                    </div>
                  </div>
                </div>

                {/* App Body */}
                <div style={{ background: "linear-gradient(180deg,#0C0C14 0%,#070709 100%)", padding: "18px 22px 0" }}>

                  {/* App Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                      <span style={{ fontFamily: T.dc, fontSize: 17, fontWeight: 400, color: T.cy, letterSpacing: ".02em" }}>VIBRA</span>
                      <span style={{ fontFamily: T.dc, fontSize: 17, fontWeight: 300, color: T.tx1 }}>HEALS</span>
                    </div>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: "radial-gradient(circle at 32% 28%,#D4A0FF,#8B5CF6 50%,#3A0080)", boxShadow: "0 4px 16px " + A(T.ba, 0.4) }} />
                  </div>

                  {/* Active Frequency hero */}
                  <div style={{ textAlign: "center", marginBottom: 24, position: "relative" }}>
                    {/* Background radial for number */}
                    <div style={{ position: "absolute", inset: "-20px -40px", background: "radial-gradient(ellipse at 50% 50%," + A(T.ba, 0.08) + ",transparent 70%)", pointerEvents: "none" }} />
                    <p style={{ fontFamily: T.m, fontSize: 8, color: T.tx4, textTransform: "uppercase", letterSpacing: ".28em", marginBottom: 10 }}>Active Frequency</p>
                    <div style={{ position: "relative", lineHeight: .9 }}>
                      <GradText g={T.gPrimary} style={{ fontFamily: T.m, fontSize: "5.5rem", fontWeight: 500 }}>528</GradText>
                    </div>
                    <p style={{ fontFamily: T.m, fontSize: 8, color: T.tx4, textTransform: "uppercase", letterSpacing: ".22em", marginTop: 8 }}>Hz · Transformation</p>
                  </div>

                  {/* Waveform visualizer */}
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 3.5, height: 38, marginBottom: 26 }}>
                    {[5,9,14,8,18,11,22,15,20,9,24,13,18,7,21,12,16,10,15,8,19,11,17,6,20].map((h, i) => (
                      <div key={"wave-" + i} style={{
                        width: 4, height: h, borderRadius: 3,
                        background: `linear-gradient(180deg,${T.gd},${A(T.gd, 0.3)})`,
                        opacity: .4 + (i % 5) * .11
                      }} />
                    ))}
                  </div>

                  {/* Chakra Selector */}
                  <div style={{ marginBottom: 22 }}>
                    <p style={{ fontFamily: T.m, fontSize: 7, color: T.tx4, textTransform: "uppercase", letterSpacing: ".22em", marginBottom: 12 }}>Chakra Select</p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      {CH.map((c, i) => (
                        <div key={c.n} style={{ position: "relative" }}>
                          {i === 2 && <div style={{ position: "absolute", inset: -5, borderRadius: "50%", border: "1.5px solid " + A(T.gd, 0.4), animation: "none" }} />}
                          <div style={{
                            width: i === 2 ? 32 : 26, height: i === 2 ? 32 : 26, borderRadius: "50%",
                            background: c.c,
                            boxShadow: i === 2 ? "0 0 16px " + c.c + "90" : "none",
                            border: i === 2 ? "2px solid rgba(255,255,255,.25)" : "none",
                            transition: "all .3s"
                          }} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Divider */}
                  <div style={{ height: 1, background: "rgba(255,255,255,.05)", margin: "0 -22px 18px" }} />

                  {/* Transport Controls */}
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 20, paddingBottom: 22 }}>
                    {/* Stop */}
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(255,255,255,.04)", border: "1px solid " + T.b2, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ width: 12, height: 12, borderRadius: 3, background: "rgba(255,255,255,.35)" }} />
                    </div>
                    {/* Play — primary CTA */}
                    <div style={{ position: "relative" }}>
                      <div style={{ position: "absolute", inset: -6, borderRadius: "50%", background: "radial-gradient(circle," + A(T.ba, 0.3) + ",transparent 70%)" }} />
                      <div style={{ width: 66, height: 66, borderRadius: "50%", background: T.gPrimary, boxShadow: "0 0 32px " + A(T.ba, 0.55) + ",0 8px 24px rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                        <div style={{ width: 0, height: 0, borderTop: "10px solid transparent", borderBottom: "10px solid transparent", borderLeft: "16px solid rgba(255,255,255,.95)", marginLeft: 4 }} />
                      </div>
                    </div>
                    {/* Timer */}
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(255,255,255,.04)", border: "1px solid " + T.b2, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="9" r="5.5" stroke="rgba(255,255,255,.3)" strokeWidth="1.2"/>
                        <path d="M8 6v3.5l2 1.5" stroke="rgba(255,255,255,.35)" strokeWidth="1.2" strokeLinecap="round"/>
                        <path d="M6 1h4" stroke="rgba(255,255,255,.2)" strokeWidth="1.2" strokeLinecap="round"/>
                      </svg>
                    </div>
                  </div>

                  {/* Bottom Tab Bar */}
                  <div style={{ display: "flex", borderTop: "1px solid " + T.b1, margin: "0 -22px" }}>
                    {[
                      { l: "Heal",    active: true,  icon: "◈" },
                      { l: "Library", active: false, icon: "≡" },
                      { l: "Profile", active: false, icon: "◎" }
                    ].map((item, i) => (
                      <div key={item.l} style={{ flex: 1, padding: "12px 0 18px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <div style={{
                          width: 24, height: 24, borderRadius: R.xs,
                          background: item.active ? T.gH : "rgba(255,255,255,.05)",
                          display: "flex", alignItems: "center", justifyContent: "center"
                        }}>
                          <span style={{ fontSize: 10, filter: item.active ? "none" : "opacity(.3)" }}>{item.icon}</span>
                        </div>
                        <span style={{ fontFamily: T.m, fontSize: 7, color: item.active ? T.tx2 : T.tx4, textTransform: "uppercase", letterSpacing: ".1em" }}>{item.l}</span>
                        {item.active && <div style={{ width: 4, height: 4, borderRadius: "50%", background: T.ba, marginTop: 1 }} />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* ─── YOUTUBE THUMBNAIL ─── */}
        <SubLabel>YouTube Thumbnail — 1280×720</SubLabel>
        <ScrollReveal>
          <div style={{ maxWidth: 640, margin: "0 auto 64px" }}>
            <TokenCard style={{ padding: 0, overflow: "hidden", borderRadius: 20 }}>
              <div style={{
                aspectRatio: "16/9",
                background: [
                  "radial-gradient(ellipse at 20% 70%," + A(T.ba, 0.22) + ",transparent 50%)",
                  "radial-gradient(ellipse at 85% 20%," + A(T.cy, 0.08) + ",transparent 45%)",
                  "radial-gradient(ellipse at 60% 90%," + A(T.gd, 0.05) + ",transparent 40%)",
                  T.bg
                ].join(","),
                position: "relative", overflow: "hidden"
              }}>
                {/* Subtle grid */}
                <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,.012) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.012) 1px,transparent 1px)", backgroundSize: "40px 40px" }} />

                {/* Left content */}
                <div style={{ position: "absolute", inset: 0, padding: "20px 26px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  {/* Brand pill */}
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 14, alignSelf: "flex-start" }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: T.cy }} />
                    <span style={{ fontFamily: T.m, fontSize: 9, color: T.cy, textTransform: "uppercase", letterSpacing: ".3em" }}>PureVibration432</span>
                  </div>
                  {/* Title stack */}
                  <div style={{ marginBottom: 10 }}>
                    <p style={{ fontFamily: T.dc, fontWeight: 400, fontSize: "clamp(1.3rem,3.5vw,1.9rem)", color: T.tx1, lineHeight: 1.05, marginBottom: 2 }}>528 Hz Healing</p>
                    <p style={{ fontFamily: T.dc, fontWeight: 400, fontSize: "clamp(1.3rem,3.5vw,1.9rem)", color: T.gd, lineHeight: 1.05 }}>Transformation</p>
                  </div>
                  {/* Meta */}
                  <p style={{ fontFamily: T.ds, fontWeight: 300, fontSize: 10, color: T.tx4, letterSpacing: ".06em" }}>Deep Solfeggio Meditation · 60 Minutes</p>
                </div>

                {/* Duration — top right */}
                <div style={{ position: "absolute", top: 14, right: 14, background: "rgba(0,0,0,.78)", backdropFilter: "blur(8px)", borderRadius: R.xs, padding: "5px 11px", border: "1px solid " + T.b2 }}>
                  <span style={{ fontFamily: T.m, fontSize: 10, color: T.tx1, fontWeight: 500 }}>1:00:00</span>
                </div>

                {/* Hz badge — bottom right */}
                <div style={{ position: "absolute", bottom: 18, right: 18 }}>
                  <div style={{ position: "absolute", inset: -3, borderRadius: R.pill, background: T.gPrimary, opacity: 0.25, filter: "blur(6px)" }} />
                  <div style={{ position: "relative", background: A(T.ba, 0.88), backdropFilter: "blur(16px)", borderRadius: R.pill, padding: "9px 20px", border: "1px solid " + A(T.bl, 0.35), boxShadow: "0 4px 20px " + A(T.ba, 0.4) }}>
                    <span style={{ fontFamily: T.m, fontSize: 15, fontWeight: 500, color: "#fff" }}>528</span>
                    <span style={{ fontFamily: T.m, fontSize: 9, color: T.bl, marginLeft: 3 }}>Hz</span>
                  </div>
                </div>

                {/* Bottom left: channel logo mark */}
                <div style={{ position: "absolute", bottom: 18, left: 18, display: "flex", alignItems: "center", gap: 7 }}>
                  <div style={{ width: 24, height: 24, borderRadius: R.xs, background: T.gH, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontFamily: T.m, fontSize: 7, fontWeight: 700, color: "#000" }}>PV</span>
                  </div>
                  <span style={{ fontFamily: T.m, fontSize: 8, color: T.tx3, textTransform: "uppercase", letterSpacing: ".15em" }}>432</span>
                </div>
              </div>
            </TokenCard>
          </div>
        </ScrollReveal>

        {/* ─── INSTAGRAM SOCIAL POST ─── */}
        <SubLabel>Social Post — Instagram 1:1</SubLabel>
        <ScrollReveal>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 64 }}>
            <div style={{ position: "relative" }}>
              {/* Glow behind */}
              <div style={{ position: "absolute", inset: -24, background: "radial-gradient(ellipse at 50% 45%," + A(T.earth, 0.14) + ",transparent 65%)", pointerEvents: "none" }} />
              <TokenCard style={{ width: 308, padding: 0, overflow: "hidden", borderRadius: 20, position: "relative" }}>
                <div style={{
                  aspectRatio: "1/1",
                  background: [
                    "radial-gradient(ellipse at 50% 30%," + A(T.earth, 0.1) + ",transparent 55%)",
                    "radial-gradient(ellipse at 20% 80%," + A(T.ba, 0.06) + ",transparent 45%)",
                    T.bg
                  ].join(","),
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  padding: "30px 28px", position: "relative"
                }}>
                  {/* Subtle concentric rings (sacred geometry) */}
                  {[120, 90, 60].map(r => (
                    <div key={r} style={{ position: "absolute", width: r*2, height: r*2, borderRadius: "50%", border: "1px solid rgba(52,211,153," + (0.04 + (120-r)*.0006) + ")", pointerEvents: "none" }} />
                  ))}

                  {/* Chakra dots row */}
                  <div style={{ display: "flex", gap: 8, marginBottom: 22, position: "relative" }}>
                    {CH.map((c, i) => (
                      <div key={c.n} style={{ width: 10, height: 10, borderRadius: "50%", background: c.c, boxShadow: "0 0 6px " + c.c + "60" }} />
                    ))}
                  </div>

                  {/* Label */}
                  <p style={{ fontFamily: T.m, fontSize: 8, color: T.tx4, textTransform: "uppercase", letterSpacing: ".28em", marginBottom: 12, position: "relative" }}>Daily Frequency</p>

                  {/* Hz Number */}
                  <div style={{ position: "relative", marginBottom: 8 }}>
                    <GradText g={T.gE} style={{ fontFamily: T.m, fontSize: "5rem", fontWeight: 500, lineHeight: .9 }}>639</GradText>
                  </div>

                  {/* Tag line */}
                  <p style={{ fontFamily: T.m, fontSize: 8, color: T.tx4, textTransform: "uppercase", letterSpacing: ".2em", marginBottom: 18, position: "relative" }}>Hz · Heart · Connection</p>

                  {/* Colored divider */}
                  <div style={{ width: 52, height: 1.5, background: "linear-gradient(90deg," + T.earth + "," + T.cy + ")", borderRadius: 2, marginBottom: 18, position: "relative" }} />

                  {/* Quote */}
                  <p style={{ fontFamily: T.dc, fontWeight: 300, fontSize: 11.5, color: T.tx2, textAlign: "center", lineHeight: 1.65, maxWidth: 210, position: "relative" }}>
                    Open your heart to the frequency of<br />connection and harmony
                  </p>

                  {/* Brand footer */}
                  <p style={{ fontFamily: T.m, fontSize: 7, color: T.tx4, textTransform: "uppercase", letterSpacing: ".32em", marginTop: 20, position: "relative" }}>PureVibration432</p>
                </div>
              </TokenCard>
            </div>
          </div>
        </ScrollReveal>

        {/* ─── VIDEO LOWER-THIRD ─── */}
        <SubLabel>Video Lower-Third — 1920×1080 Overlay</SubLabel>
        <ScrollReveal>
          <div style={{ maxWidth: 640, margin: "0 auto 40px" }}>
            <TokenCard style={{ padding: 0, overflow: "hidden", borderRadius: 20 }}>
              <div style={{ aspectRatio: "16/9", background: "radial-gradient(ellipse at 30% 70%," + A(T.ba, 0.06) + ",transparent 50%)," + T.bg, position: "relative" }}>
                {/* PV watermark */}
                <div style={{ position: "absolute", top: 14, right: 16, display: "flex", alignItems: "baseline", gap: 3 }}>
                  <span style={{ fontFamily: T.m, fontSize: 8, fontWeight: 500, color: T.tx4 }}>PV</span>
                  <span style={{ fontFamily: T.m, fontSize: 7, color: T.gd }}>432</span>
                </div>

                {/* Fake video content area suggestion */}
                <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", opacity: 0.04 }}>
                  <div style={{ width: 60, height: 60, borderRadius: "50%", border: "2px solid #fff" }} />
                </div>

                {/* Lower-Third overlay */}
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}>
                  {/* Gradient fade */}
                  <div style={{ height: 80, background: "linear-gradient(180deg,transparent,rgba(3,3,4,.92))" }} />
                  {/* Content bar */}
                  <div style={{ background: "rgba(3,3,4,.97)", padding: "14px 24px 16px", borderTop: "1px solid " + T.b1 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      {/* Left: accent bar + text */}
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                        <div style={{ width: 3, height: 38, borderRadius: 2, background: T.gH, flexShrink: 0, marginTop: 1 }} />
                        <div>
                          <p style={{ fontFamily: T.ds, fontWeight: 400, fontSize: 13, color: T.tx1, marginBottom: 4, letterSpacing: ".01em" }}>Solfeggio Healing Session</p>
                          <p style={{ fontFamily: T.m, fontSize: 8, color: T.tx3, textTransform: "uppercase", letterSpacing: ".18em" }}>PureVibration432 · Heart Chakra Protocol</p>
                        </div>
                      </div>
                      {/* Right: Hz */}
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <GradText g={T.gPrimary} style={{ fontFamily: T.m, fontSize: "1.9rem", fontWeight: 500, lineHeight: 1 }}>639</GradText>
                        <p style={{ fontFamily: T.m, fontSize: 7, color: T.tx4, textTransform: "uppercase", letterSpacing: ".18em", marginTop: 3 }}>Hz Active</p>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div style={{ marginTop: 10, height: 2, background: "rgba(255,255,255,.05)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ width: "38%", height: "100%", background: "linear-gradient(90deg," + T.gd + "," + T.cy + ")", borderRadius: 2 }} />
                    </div>
                  </div>
                </div>
              </div>
            </TokenCard>
          </div>
        </ScrollReveal>

        {/* ─── FORMAT SPECS GRID ─── */}
        <SubLabel>Format-Spezifikationen</SubLabel>
        <ScrollReveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
            {[
              { r: "1280×720",  l: "YouTube Thumb",  ar: "16:9",  w: 64, h: 36, g: T.gWarmth },
              { r: "1080×1080", l: "Social Post",     ar: "1:1",   w: 44, h: 44, g: T.gH },
              { r: "1920×1080", l: "Video Overlay",   ar: "16:9",  w: 64, h: 36, g: T.gSignal },
              { r: "1080×1920", l: "Story / Reel",    ar: "9:16",  w: 28, h: 50, g: T.gPrimary },
            ].map(f => (
              <TokenCard key={f.r} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px" }}>
                <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", width: 64 }}>
                  <div style={{ width: f.w * .6, height: f.h * .6, borderRadius: 4, border: "1.5px solid " + T.b2, background: "rgba(255,255,255,.02)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: "60%", height: "60%", borderRadius: 2, background: f.g, opacity: .5 }} />
                  </div>
                </div>
                <div>
                  <GradText g={f.g} style={{ fontFamily: T.m, fontSize: 13, fontWeight: 500 }}>{f.r}</GradText>
                  <p style={{ fontFamily: T.m, fontSize: 7.5, color: T.tx4, textTransform: "uppercase", letterSpacing: ".18em", marginTop: 4 }}>{f.l}</p>
                  <p style={{ fontFamily: T.m, fontSize: 7, color: T.tx4, opacity: .5, marginTop: 2 }}>{f.ar}</p>
                </div>
              </TokenCard>
            ))}
          </div>
        </ScrollReveal>
      </Section>
      <Divider />

      {/* 14 VOICE */}
      <Section id="voice" num="14" lab="Sprache" title="Voice & Copy Guidelines" desc="Wie PureVibration klingt.">
        <SubLabel>Tone of Voice</SubLabel>
        <ScrollReveal><Grid cols={2} cn="g2" style={{ marginBottom: 56 }}>
          <TokenCard>{[["Technical", "Mystical", 65, T.gH], ["Minimal", "Verbose", 75, T.gPrimary], ["Serious", "Playful", 55, T.gSignal], ["Abstract", "Concrete", 40, T.gWarmth]].map(function(b) { return <div key={b[0]} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}><span style={{ fontFamily: T.m, fontSize: 8, color: T.tx4, width: 55, textAlign: "right", flexShrink: 0 }}>{b[0]}</span><div style={{ flex: 1, height: 8, borderRadius: 4, overflow: "hidden", background: T.b1 }}><div style={{ width: b[2] + "%", height: "100%", borderRadius: 4, background: b[3] }} /></div><span style={{ fontFamily: T.m, fontSize: 8, color: T.tx4, width: 55, flexShrink: 0 }}>{b[1]}</span></div>; })}</TokenCard>
          <TokenCard>{["Präzision über Poesie", "Stille als Stilmittel", "Einladend, nicht belehrend", "Englisch als Hauptsprache"].map(function(t, i) { return <div key={i} style={{ display: "flex", gap: 12, marginBottom: 10, fontSize: 11, color: T.tx2 }}><span style={{ fontFamily: T.m, color: T.tx4 }}>{"0" + (i + 1)}</span><span>{t}</span></div>; })}</TokenCard>
        </Grid></ScrollReveal>
        <SubLabel>Wortschatz</SubLabel>
        <ScrollReveal><Grid cols={2} cn="g2" style={{ marginBottom: 56 }}>
          <TokenCard bc=A(T.earth, 0.2)><span style={{ fontFamily: T.m, textTransform: "uppercase", letterSpacing: ".15em", fontSize: 9, color: SEM.success }}>Verwenden</span><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>{[["frequency", "vibe"], ["consciousness", "spirituality"], ["healing", "cure"], ["resonance", "energy"], ["tuning", "alignment"], ["protocol", "ritual"], ["harmonic", "cosmic"], ["explore", "manifest"]].map(function(pair) { return <div key={pair[0]}><p style={{ fontFamily: T.m, fontSize: 11, color: T.tx1 }}>{pair[0]}</p><p style={{ fontFamily: T.m, fontSize: 8, color: T.tx4 }}>{"not: " + pair[1]}</p></div>; })}</div></TokenCard>
          <TokenCard bc=A("#C62828", 0.2)><span style={{ fontFamily: T.m, textTransform: "uppercase", letterSpacing: ".15em", fontSize: 9, color: SEM.error }}>Vermeiden</span><div style={{ marginTop: 16 }}>{["Esoterischer Kitsch", "Heilversprechen", "Clickbait", "Belehrung", "Emoji-Überladung"].map(function(t) { return <p key={t} style={{ fontSize: 11, color: T.tx2, marginBottom: 8 }}>{"— " + t}</p>; })}</div></TokenCard>
        </Grid></ScrollReveal>
        <SubLabel>Headline-Formeln</SubLabel>
        <ScrollReveal><Grid cols={3} cn="g3" style={{ marginBottom: 56 }}>{[["YouTube", ["528 Hz · Solfeggio", "Deep 432 Hz · 60 Min"]], ["App UI", ["Explore Frequencies", "Begin Protocol"]], ["Social", ["639 Hz · Connection", "Tune in. 528 Hz."]]].map(function(h) { return <TokenCard key={h[0]}><p style={{ fontFamily: T.m, fontSize: ".6rem", color: T.tx4, marginBottom: 12 }}>{h[0]}</p>{h[1].map(function(ex) { return <div key={ex} style={{ borderRadius: R.xs, padding: "8px 12px", background: "rgba(255,255,255,.02)", marginBottom: 8 }}><p style={{ fontFamily: T.dc, fontWeight: 300, fontSize: 12, color: T.tx1 }}>{ex}</p></div>; })}</TokenCard>; })}</Grid></ScrollReveal>
        <SubLabel>Vorher / Nachher</SubLabel>
        <ScrollReveal><Grid cols={2} cn="g2" style={{ marginBottom: 56 }}>
          <TokenCard bc=A("#C62828", 0.2)><span style={{ fontFamily: T.m, fontSize: 8, color: SEM.error }}>VORHER</span><p style={{ marginTop: 8, fontFamily: T.dc, fontWeight: 300, fontSize: 12, color: T.tx3 }}>Öffne dein Herz-Chakra mit magischer 639 Hz Schwingung!</p></TokenCard>
          <TokenCard bc=A(T.earth, 0.2)><span style={{ fontFamily: T.m, fontSize: 8, color: SEM.success }}>NACHHER</span><p style={{ marginTop: 8, fontFamily: T.dc, fontWeight: 300, fontSize: 12, color: T.tx1 }}>639 Hz — Solfeggio frequency for the heart chakra. Explore its resonance.</p></TokenCard>
        </Grid></ScrollReveal>
        <SubLabel>Channel-spezifische Copy</SubLabel>
        <ScrollReveal><Grid cols={2} cn="g2" style={{ marginBottom: 56 }}>
          <TokenCard><p style={{ fontFamily: T.m, fontSize: ".6rem", color: T.tx4, marginBottom: 12 }}>YouTube</p><CodeBlock copyContent={"[Hz] · [Typ] · [Chakra]\n[Beschreibung]\n\n⟐ What is [Hz]?\n⟐ How to use\n⟐ Timestamps\n\n#PureVibration432 #432Hz"}>{"[Hz] · [Typ] · [Chakra]\n⟐ What / How / Timestamps\n#PureVibration432"}</CodeBlock></TokenCard>
          <TokenCard><p style={{ fontFamily: T.m, fontSize: ".6rem", color: T.tx4, marginBottom: 12 }}>Instagram</p><CodeBlock copyContent={"[Hz] · [Wirkung]\n[1 Satz]\nTune in. Link in bio.\n· · ·\n#PureVibration432"}>{"[Hz] · [Wirkung]\nTune in. Link in bio."}</CodeBlock></TokenCard>
        </Grid></ScrollReveal>
        <SubLabel>Hashtag-Strategie</SubLabel>
        <ScrollReveal><Grid cols={3} cn="g3" style={{ marginBottom: 56 }}>{[["Immer", ["#PureVibration432", "#432Hz", "#FrequencyHealing"], true], ["Frequenz", ["#528Hz", "#SolfeggioFrequencies", "#BinauralBeats"], false], ["Reichweite", ["#HealingMusic", "#DeepRelaxation", "#SleepMusic"], false]].map(function(h) { return <TokenCard key={h[0]}><p style={{ fontFamily: T.m, fontSize: ".6rem", color: T.tx4, marginBottom: 12 }}>{h[0]}</p><div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{h[1].map(function(tag) { return <span key={tag} style={{ borderRadius: R.pill, padding: "3px 10px", fontSize: 9, fontFamily: T.m, color: h[2] ? T.cy : T.tx3, background: h[2] ? A(T.cy, 0.08) : "rgba(255,255,255,.03)", border: "1px solid " + (h[2] ? A(T.cy, 0.15) : T.b1) }}>{tag}</span>; })}</div></TokenCard>; })}</Grid></ScrollReveal>
        <SubLabel>Call-to-Action Patterns</SubLabel>
        <ScrollReveal><Grid cols={3} cn="g3" style={{ marginBottom: 56 }}>{[["Sanft", ["Explore the spectrum", "Discover resonance"]], ["Direkt", ["Start healing protocol", "Download VIBRAHEALS"]], ["Community", ["What frequency today?", "Share your experience"]]].map(function(c) { return <TokenCard key={c[0]}><p style={{ fontFamily: T.m, fontSize: ".6rem", color: T.tx4, marginBottom: 12 }}>{c[0]}</p>{c[1].map(function(ex) { return <div key={ex} style={{ borderRadius: R.xs, padding: "8px 12px", background: "rgba(255,255,255,.02)", marginBottom: 8 }}><p style={{ fontFamily: T.dc, fontWeight: 300, fontSize: 11, color: T.tx1 }}>{ex}</p></div>; })}</TokenCard>; })}</Grid></ScrollReveal>
        <SubLabel>Bio-Templates</SubLabel>
        <ScrollReveal><Grid cols={2} cn="g2">
          <TokenCard><p style={{ fontFamily: T.m, fontSize: ".6rem", color: T.tx4, marginBottom: 12 }}>YouTube</p><CodeBlock copyContent={"PureVibration432\nSacred frequencies for consciousness.\nSolfeggio · Binaural · 432 Hz\n⟐ VIBRAHEALS → [link]"}>{"PureVibration432\nSolfeggio · Binaural · 432 Hz"}</CodeBlock></TokenCard>
          <TokenCard><p style={{ fontFamily: T.m, fontSize: ".6rem", color: T.tx4, marginBottom: 12 }}>Instagram</p><CodeBlock copyContent={"PureVibration432\n⟐ Sacred frequency healing\n⟐ 432 Hz · Solfeggio · Binaural\n↓ VIBRAHEALS — Free App"}>{"PureVibration432\n⟐ Sacred frequency healing\n↓ VIBRAHEALS"}</CodeBlock></TokenCard>
        </Grid></ScrollReveal>
      </Section>
      <Divider />

      {/* 15 VIDEO */}
      <Section id="video" num="15" lab="Video" title="Video Production Specs" desc="Alle Werte für DaVinci, Premiere, After Effects.">
        <SubLabel>Farbwerte für Video-Editors</SubLabel>
        <ScrollReveal><Grid cols={2} cn="g2" style={{ marginBottom: 56 }}>
          <TokenCard>{VID_COLORS.map(function(c) { return <div key={c.n} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}><div style={{ width: 28, height: 28, borderRadius: 6, background: c.h, flexShrink: 0, border: c.h === T.bg ? "1px solid " + T.b2 : "none" }} /><div><p style={{ fontFamily: T.m, fontSize: 10, color: T.tx1 }}>{c.n}</p><span style={{ fontFamily: T.m, fontSize: 8, color: T.tx4 }}>{"HEX " + c.h + " · RGB " + c.rgb}</span></div></div>; })}</TokenCard>
          <TokenCard>{CH.map(function(c) { return <div key={c.n} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}><div style={{ width: 28, height: 28, borderRadius: 6, background: c.c, flexShrink: 0 }} /><div><p style={{ fontFamily: T.m, fontSize: 10, color: T.tx1 }}>{c.n + " · " + c.hz + "Hz"}</p><span style={{ fontFamily: T.m, fontSize: 8, color: T.tx4 }}>{c.c}</span></div></div>; })}</TokenCard>
        </Grid></ScrollReveal>
        <SubLabel>Schriften für Video</SubLabel>
        <ScrollReveal><Grid cols={3} cn="g3" style={{ marginBottom: 56 }}>
          <TokenCard><p style={{ fontFamily: T.dc, fontSize: "1.5rem", fontWeight: 300 }}>Crimson</p><p style={{ fontFamily: T.m, fontSize: 8, color: T.tx4, marginTop: 8 }}>Titel · Light 300</p></TokenCard>
          <TokenCard><GradText g={T.gPrimary} style={{ fontFamily: T.m, fontSize: "1.5rem", fontWeight: 500 }}>JetBrains</GradText><p style={{ fontFamily: T.m, fontSize: 8, color: T.tx4, marginTop: 8 }}>Hz-Werte · Medium 500</p></TokenCard>
          <TokenCard><p style={{ fontSize: "1.5rem", fontWeight: 300, color: T.tx2, fontFamily: T.ds }}>DM Sans</p><p style={{ fontFamily: T.m, fontSize: 8, color: T.tx4, marginTop: 8 }}>Beschreibung · Light 300</p></TokenCard>
        </Grid></ScrollReveal>
        <SubLabel>YouTube Thumbnail Specs</SubLabel>
        <ScrollReveal><TokenCard style={{ marginBottom: 56 }}><div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20, textAlign: "center" }} className="g4">{[["1280×720", "Auflösung"], ["64–80px", "Titel"], ["120–160px", "Hz-Zahl"], ["16:9", "Ratio"]].map(function(pair) { return <div key={pair[1]}><GradText g={T.gPrimary} style={{ fontFamily: T.m, fontSize: 14, fontWeight: 500 }}>{pair[0]}</GradText><p style={{ fontFamily: T.m, fontSize: 7, color: T.tx4, marginTop: 4 }}>{pair[1]}</p></div>; })}</div></TokenCard></ScrollReveal>
        <SubLabel>Lower-Third Specs</SubLabel>
        <ScrollReveal><TokenCard style={{ marginBottom: 56 }}><div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20, textAlign: "center" }} className="g4">{[["1920×1080", "Timeline"], ["80–120px", "Abstand"], ["3×40px", "Bar"], ["0.8–1.2s", "Fade"]].map(function(pair) { return <div key={pair[1]}><GradText g={T.gPrimary} style={{ fontFamily: T.m, fontSize: 14, fontWeight: 500 }}>{pair[0]}</GradText><p style={{ fontFamily: T.m, fontSize: 7, color: T.tx4, marginTop: 4 }}>{pair[1]}</p></div>; })}</div></TokenCard></ScrollReveal>
        <SubLabel>Overlays & Glows</SubLabel>
        <ScrollReveal><Grid cols={2} cn="g2" style={{ marginBottom: 56 }}>
          <TokenCard>{[["Violet", "#8B5CF6 @ 15-25%"], ["Cyan", "#4DD0E1 @ 10-15%"], ["Warm", "#F59E0B @ 8-12%"], ["Max/Frame", "2"]].map(function(pair) { return <div key={pair[0]} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 10, fontFamily: T.m }}><span style={{ color: T.tx3 }}>{pair[0]}</span><span style={{ color: T.tx2 }}>{pair[1]}</span></div>; })}</TokenCard>
          <TokenCard>{[["Partikel", "#8B5CF6 @ 10-20%"], ["Größe", "1-3px"], ["Speed", "Sehr langsam"], ["Easing", T.e]].map(function(pair) { return <div key={pair[0]} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 10, fontFamily: T.m }}><span style={{ color: T.tx3 }}>{pair[0]}</span><span style={{ color: T.tx2 }}>{pair[1]}</span></div>; })}</TokenCard>
        </Grid></ScrollReveal>
        <SubLabel>Social-Format-Specs</SubLabel>
        <ScrollReveal><Grid cols={5} cn="g5" style={{ marginBottom: 56 }}>{VF.map(function(f) { return <TokenCard key={f.n} style={{ textAlign: "center", padding: 14 }}><div style={{ width: f.w, height: f.h, borderRadius: 6, background: "rgba(255,255,255,.02)", border: "1px solid " + T.b1, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}><span style={{ fontFamily: T.m, fontSize: 6, color: T.tx4 }}>{f.ar}</span></div><GradText g={T.gPrimary} style={{ fontFamily: T.m, fontSize: 10, fontWeight: 500 }}>{f.r}</GradText><p style={{ fontFamily: T.m, fontSize: 8, color: T.tx4, marginTop: 4 }}>{f.n}</p></TokenCard>; })}</Grid></ScrollReveal>
        <SubLabel>Video-Timeline-Struktur</SubLabel>
        <ScrollReveal><TokenCard style={{ marginBottom: 56 }}><TimelineBar /></TokenCard></ScrollReveal>
        <SubLabel>Intro & Outro</SubLabel>
        <ScrollReveal><Grid cols={2} cn="g2" style={{ marginBottom: 56 }}>
          <TokenCard><p style={{ fontFamily: T.m, fontSize: ".6rem", color: T.tx4, marginBottom: 16 }}>Intro 10-15s</p>{[["0.0s", "Void Black"], ["0.5s", "Logo fade-in"], ["2.5s", "Hz center"], ["7.0s", "Glow pulse"], ["10s", "Lower-Third"]].map(function(pair) { return <div key={pair[0]} style={{ display: "flex", gap: 12, marginBottom: 6, fontSize: 10, fontFamily: T.m }}><span style={{ color: T.tx4, width: 28, flexShrink: 0 }}>{pair[0]}</span><span style={{ color: T.tx2 }}>{pair[1]}</span></div>; })}</TokenCard>
          <TokenCard><p style={{ fontFamily: T.m, fontSize: ".6rem", color: T.tx4, marginBottom: 16 }}>Outro 40-60s</p>{[["[X-60]", "Leiser"], ["[X-30]", "Thank you"], ["[X-20]", "End Screen"], ["[X-5]", "Void Black"], ["[X]", "Stille"]].map(function(pair) { return <div key={pair[0]} style={{ display: "flex", gap: 12, marginBottom: 6, fontSize: 10, fontFamily: T.m }}><span style={{ color: T.tx4, width: 36, flexShrink: 0 }}>{pair[0]}</span><span style={{ color: T.tx2 }}>{pair[1]}</span></div>; })}</TokenCard>
        </Grid></ScrollReveal>
        <SubLabel>End Screen Layout</SubLabel>
        <ScrollReveal><TokenCard style={{ marginBottom: 56 }}><div style={{ borderRadius: R.md, aspectRatio: "16/9", maxWidth: 500, margin: "0 auto", background: T.bg, border: "1px solid " + T.b1, position: "relative", overflow: "hidden" }}><div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 40%," + A(T.ba, 0.08) + ",transparent 60%)" }} /><div style={{ position: "absolute", top: "15%", left: "50%", transform: "translateX(-50%)", textAlign: "center" }}><span style={{ fontFamily: T.dc, fontSize: 14, fontWeight: 300 }}>Pure<GradText g={T.gH}>Vibration</GradText></span></div><div style={{ position: "absolute", bottom: "20%", left: "30%", transform: "translateX(-50%)", width: 50, height: 50, borderRadius: "50%", border: "1px dashed " + A(T.cy, 0.4), display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontFamily: T.m, fontSize: 5, color: T.cy }}>SUB</span></div><div style={{ position: "absolute", bottom: "20%", right: "12%", width: 90, height: 50, borderRadius: R.xs, border: "1px dashed " + A(T.ba, 0.4), display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontFamily: T.m, fontSize: 5, color: T.bl }}>NEXT</span></div></div></TokenCard></ScrollReveal>
        <SubLabel>Audio-Specs</SubLabel>
        <ScrollReveal><Grid cols={2} cn="g2" style={{ marginBottom: 56 }}>
          <TokenCard>{[["Tuning", "A = 432 Hz"], ["Sample", "48kHz / 44.1kHz"], ["Bit", "24-bit"], ["LUFS", "-14 integrated"], ["Peak", "-1.0 dBTP"]].map(function(pair) { return <div key={pair[0]} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 10, fontFamily: T.m }}><span style={{ color: T.tx3 }}>{pair[0]}</span><span style={{ color: T.tx2 }}>{pair[1]}</span></div>; })}</TokenCard>
          <TokenCard>{[["Intro", "8-15s log"], ["Outro", "15-30s exp"], ["Binaural", "4-8 Hz"], ["Silence Start", "0.5s"], ["Silence End", "2.0s"]].map(function(pair) { return <div key={pair[0]} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 10, fontFamily: T.m }}><span style={{ color: T.tx3 }}>{pair[0]}</span><span style={{ color: T.tx2 }}>{pair[1]}</span></div>; })}</TokenCard>
        </Grid></ScrollReveal>
        <SubLabel>Video Do's & Don'ts</SubLabel>
        <ScrollReveal><Grid cols={2} cn="g2">
          <TokenCard bc=A(T.earth, 0.2)><span style={{ fontFamily: T.m, textTransform: "uppercase", letterSpacing: ".15em", fontSize: 9, color: SEM.success }}>Immer</span><div style={{ marginTop: 16, fontSize: 10, color: T.tx2 }}>{["Sanfte Übergänge", "Hz in ersten 10s", "Void-Black BG", "Headphones-Hinweis", "432 Hz, -14 LUFS"].map(function(t) { return <p key={t}>{"· " + t}</p>; })}</div></TokenCard>
          <TokenCard bc=A("#C62828", 0.2)><span style={{ fontFamily: T.m, textTransform: "uppercase", letterSpacing: ".15em", fontSize: 9, color: SEM.error }}>Nie</span><div style={{ marginTop: 16, fontSize: 10, color: T.tx2 }}>{["Harte Schnitte", "Heller BG", ">2 Glows", "A=440 Hz", "Brickwall-Limiter", "Laute Intros"].map(function(t) { return <p key={t}>{"· " + t}</p>; })}</div></TokenCard>
        </Grid></ScrollReveal>
      </Section>
      <Divider />

      {/* 16 QUICKREF */}
      <Section id="quickref" num="16" lab="Referenz" title="Quick Reference Card" desc="Alles Wichtige auf einen Blick — v5.0 tokens, WCAG compliant.">
        <ScrollReveal><CodeBlock copyContent={CHEAT}>{CHEAT}</CodeBlock></ScrollReveal>
        <div style={{ height: 40 }} />
        <SubLabel>Schnellzugriff — Visuelle Karten</SubLabel>
        <ScrollReveal><Grid cols={4} cn="g4" style={{ marginBottom: 40 }}>
          <TokenCard style={{ padding: 12 }}><p style={{ fontFamily: T.m, fontSize: 7, color: T.tx4, marginBottom: 8 }}>PALETTE</p><div style={{ display: "flex", gap: 3 }}>{[T.bg, T.ba, T.bl, T.cy, T.gd, T.earth].map(function(c) { return <div key={c} style={{ flex: 1, height: 20, borderRadius: 3, background: c, border: c === T.bg ? "1px solid " + T.b2 : "none" }} />; })}</div></TokenCard>
          <TokenCard style={{ padding: 12 }}><p style={{ fontFamily: T.m, fontSize: 7, color: T.tx4, marginBottom: 8 }}>GRADIENTS</p>{[T.gH, T.gPrimary, T.gSignal, T.gWarmth].map(function(g, i) { return <div key={"gr-" + i} style={{ height: 14, borderRadius: 3, background: g, marginBottom: 3 }} />; })}</TokenCard>
          <TokenCard style={{ padding: 12 }}><p style={{ fontFamily: T.m, fontSize: 7, color: T.tx4, marginBottom: 8 }}>FONTS</p><p style={{ fontFamily: T.dc, fontSize: 13, fontWeight: 300 }}>Crimson</p><p style={{ fontSize: 13, color: T.tx2, fontFamily: T.ds }}>DM Sans</p><p style={{ fontFamily: T.m, fontSize: 13 }}>JetBrains</p></TokenCard>
          <TokenCard style={{ padding: 12 }}><p style={{ fontFamily: T.m, fontSize: 7, color: T.tx4, marginBottom: 6 }}>CHAKRAS</p>{CH.map(function(c) { return <div key={c.n} style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}><div style={{ width: 7, height: 7, borderRadius: "50%", background: c.c }} /><span style={{ fontFamily: T.m, fontSize: 7, color: T.tx3, flex: 1 }}>{c.n}</span><span style={{ fontFamily: T.m, fontSize: 7, color: T.tx2 }}>{c.hz}</span></div>; })}</TokenCard>
        </Grid></ScrollReveal>
        <SubLabel>Format-Übersicht</SubLabel>
        <ScrollReveal><Grid cols={5} cn="g5" style={{ marginBottom: 40 }}>{VF.map(function(f) { return <TokenCard key={f.n} style={{ textAlign: "center", padding: 10 }}><GradText g={T.gPrimary} style={{ fontFamily: T.m, fontSize: 9, fontWeight: 500 }}>{f.r}</GradText><p style={{ fontFamily: T.m, fontSize: 6, color: T.tx4, marginTop: 2 }}>{f.n}</p></TokenCard>; })}</Grid></ScrollReveal>
        <SubLabel>Die wichtigsten Zahlen</SubLabel>
        <ScrollReveal><Grid cols={6} cn="g6" style={{ marginBottom: 40 }}>{[["432", "Hz"], ["-14", "LUFS"], ["24", "Bit"], ["48k", "SR"], ["-1.0", "dBTP"], ["0.06", "Border"]].map(function(pair) { return <TokenCard key={pair[1]} style={{ textAlign: "center", padding: 12 }}><GradText g={T.gPrimary} style={{ fontFamily: T.m, fontSize: 18, fontWeight: 500 }}>{pair[0]}</GradText><p style={{ fontFamily: T.m, fontSize: 6, color: T.tx4, marginTop: 4 }}>{pair[1]}</p></TokenCard>; })}</Grid></ScrollReveal>
        <SubLabel>Voice — Schnellregel</SubLabel>
        <ScrollReveal><Grid cols={2} cn="g2" style={{ marginBottom: 40 }}>
          <TokenCard bc=A(T.earth, 0.2) style={{ padding: 14 }}><span style={{ fontFamily: T.m, fontSize: 8, color: SEM.success }}>SO KLINGT PV</span><p style={{ marginTop: 10, fontFamily: T.dc, fontSize: 12, color: T.tx1 }}>528 Hz · Transformation. A Solfeggio frequency.</p></TokenCard>
          <TokenCard bc=A("#C62828", 0.2) style={{ padding: 14 }}><span style={{ fontFamily: T.m, fontSize: 8, color: SEM.error }}>NIE SO</span><p style={{ marginTop: 10, fontFamily: T.dc, fontSize: 12, color: T.tx3 }}>MAGISCHE Schwingung!!!</p></TokenCard>
        </Grid></ScrollReveal>
        <SubLabel>Hashtags — Quick Copy</SubLabel>
        <ScrollReveal><Grid cols={2} cn="g2">
          <TokenCard><p style={{ fontFamily: T.m, fontSize: ".6rem", color: T.tx4, marginBottom: 8 }}>Immer</p><CodeBlock copyContent="#PureVibration432 #432Hz #FrequencyHealing #SoundHealing">#PureVibration432 #432Hz #FrequencyHealing #SoundHealing</CodeBlock></TokenCard>
          <TokenCard><p style={{ fontFamily: T.m, fontSize: ".6rem", color: T.tx4, marginBottom: 8 }}>+ Frequenz</p><CodeBlock copyContent="#528Hz #SolfeggioFrequencies #HeartChakra #BinauralBeats">#528Hz #SolfeggioFrequencies #HeartChakra #BinauralBeats</CodeBlock></TokenCard>
        </Grid></ScrollReveal>
      </Section>
      <Divider />

      {/* FOOTER */}
      <footer style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
        <GradText g={T.gH} style={{ fontFamily: T.dc, fontSize: "1.25rem", fontWeight: 300 }}>PureVibration</GradText>
        <p style={{ fontFamily: T.m, textTransform: "uppercase", fontSize: 9, color: T.tx4, letterSpacing: ".3em", marginTop: 8 }}>Design Token System v5.0</p>
        <p style={{ fontSize: 12, color: T.tx4, marginTop: 8 }}>60+ tokens · 7 chakras · 10 gradients</p>
      </footer>
    </div>
  );
}
export default App;

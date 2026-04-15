
// ============================================================
// FC PUBLIC SCHOOL KOHLU — React PWA (Complete Remake)
// Original: Single HTML file (Vanilla JS + Firebase)
// Remake:   React + Hooks + Firebase SDK (modular) + Tailwind
// ============================================================
//
// HOW TO RUN THIS AS A LIVE ONLINE APK:
// ─────────────────────────────────────
// 1. npm create vite@latest fcschool -- --template react
// 2. cd fcschool
// 3. npm install firebase react-router-dom
// 4. npm install -D @vitejs/plugin-pwa (for APK/PWA install)
// 5. Replace src/App.jsx with this file's content
// 6. Add vite.config.js PWA config (see bottom of this file)
// 7. npm run dev   → local live server
// 8. npm run build → production build
// 9. Deploy to Vercel / Netlify → LIVE ONLINE URL
// 10. On Android: Open URL in Chrome → "Add to Home Screen" = APK
//
// FIREBASE SETUP:
// ───────────────
// - Go to https://console.firebase.google.com
// - Create project "fcschool-kohlu"
// - Enable Firestore Database + Authentication (Email/Password)
// - Copy your firebaseConfig and replace the config below
// ============================================================

import { useState, useEffect, useCallback, createContext, useContext } from "react";

// ── Firebase Config (replace with your own) ──────────────────
const FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

// ── Auth Constants (same as original) ────────────────────────
const PRINCIPAL_EMAIL = "fcschool0123@gmail.com";
const PRINCIPAL_PASS_M = "Mprincipal@1234";
const PRINCIPAL_PASS_F = "Fprincipal@1234";
const SH_EMAIL = "fcschool0123@gmail.com";
const SH_PROFILES = {
  "Jsectionhead@1234": { name: "Junior Section Head", wing: "Junior", label: "Junior Wing" },
  "Msectionhead@1234": { name: "Middle Section Head", wing: "Middle", label: "Middle Wing" },
  "Ssectionhead@1234": { name: "Senior Section Head", wing: "Senior", label: "Senior Wing" },
};

// ── Local Storage DB (same logic as original) ─────────────────
const DB = {
  get: (k) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del: (k) => localStorage.removeItem(k),
};

const getAccs = () => DB.get("fcps-accounts") || [];
const saveAccs = (a) => DB.set("fcps-accounts", a);
const uid = () => Math.random().toString(36).slice(2, 9);
const tod = () => new Date().toISOString().slice(0, 10);

// ── Context ───────────────────────────────────────────────────
const AppCtx = createContext(null);
const useApp = () => useContext(AppCtx);

// ── Styles (inline, same palette as original) ─────────────────
const S = {
  // Colors
  navy: "#0d1b3e",
  navyDark: "#060d1e",
  navyLight: "#163680",
  gold: "#e8a020",
  goldLight: "#f5c860",
  bg: "#f0f3f9",
  white: "#fff",
  border: "#dde3f0",
  textDark: "#1a2340",
  textMuted: "#6b7a99",
  green: "#16a34a",
  red: "#dc2626",
  // Common
  card: { background: "#fff", borderRadius: 14, padding: "14px 16px", marginBottom: 12, boxShadow: "0 2px 8px rgba(13,27,62,.08)", border: "1px solid #dde3f0" },
  btn: { border: "none", borderRadius: 8, padding: "10px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "Georgia, serif" },
  inp: { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #dde3f0", fontSize: 14, outline: "none", background: "#f8faff", color: "#1a2340", fontFamily: "Georgia, serif", WebkitAppearance: "none" },
};

// ═══════════════════════════════════════════════════════════════
// AUTH SCREEN
// ═══════════════════════════════════════════════════════════════
function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login"); // login | register
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [name, setName] = useState("");
  const [pass2, setPass2] = useState("");
  const [gender, setGender] = useState("Male");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const login = () => {
    setErr(""); setOk("");
    const e = email.trim().toLowerCase();
    if (!e || !pass) return setErr("Enter your email and password.");

    // Section Head
    if (e === SH_EMAIL.toLowerCase() && SH_PROFILES[pass]) {
      const prof = SH_PROFILES[pass];
      let accs = getAccs();
      const shKey = "sh-" + pass.slice(0, 4);
      let acc = accs.find(a => a.email === e && a.role === "sectionhead" && a.shKey === shKey);
      if (!acc) { acc = { email: e, name: prof.name, role: "sectionhead", shKey, wing: prof.wing, label: prof.label, password: pass }; accs.push(acc); saveAccs(accs); }
      return onLogin(acc);
    }

    // Principal
    if (e === PRINCIPAL_EMAIL.toLowerCase()) {
      if (pass !== PRINCIPAL_PASS_M && pass !== PRINCIPAL_PASS_F) return setErr("Incorrect principal password.");
      const isFem = pass === PRINCIPAL_PASS_F && pass !== PRINCIPAL_PASS_M;
      let accs = getAccs();
      let pacc = accs.find(a => a.email === e && a.role === "principal");
      if (!pacc) { pacc = { email: e, name: isFem ? "Female Principal" : "Male Principal", role: "principal", gender: isFem ? "Female" : "Male", password: pass }; accs.push(pacc); saveAccs(accs); }
      return onLogin(pacc);
    }

    // Teacher
    const acc = getAccs().find(a => a.email === e);
    if (!acc || acc.role === "principal" || acc.role === "sectionhead") return setErr("No teacher account found.");
    if (acc.password !== pass) return setErr("Incorrect password.");
    onLogin(acc);
  };

  const register = () => {
    setErr(""); setOk("");
    const e = email.trim().toLowerCase();
    if (!name) return setErr("Please enter your full name.");
    if (!e.includes("@")) return setErr("Enter a valid email.");
    if (pass.length < 8) return setErr("Password must be at least 8 characters.");
    if (!/[A-Z]/.test(pass)) return setErr("Password must contain an uppercase letter.");
    if (!/[a-z]/.test(pass)) return setErr("Password must contain a lowercase letter.");
    if (!/[@#!$%^&*]/.test(pass)) return setErr("Password must contain a special character.");
    if (pass !== pass2) return setErr("Passwords do not match.");
    const accs = getAccs();
    if (accs.find(a => a.email === e)) return setErr("Email already registered.");
    const title = gender === "Female" ? "Mrs." : "Mr.";
    accs.push({ email: e, name, password: pass, role: "teacher", gender, title });
    saveAccs(accs);
    setOk("Account created! Signing you in...");
    setTimeout(() => { setMode("login"); setPass(""); }, 1400);
  };

  return (
    <div style={{
      minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", background: `linear-gradient(155deg,#060d1e 0%,#0d1b3e 45%,#163680 100%)`,
      padding: "24px 20px 90px", position: "relative", overflow: "hidden"
    }}>
      {/* Spinning logo */}
      <div style={{
        width: 110, height: 110, borderRadius: "50%",
        background: "conic-gradient(#e8a020,#f5c860,#e8a020,#b07010,#e8a020)",
        padding: 3, boxShadow: "0 0 28px rgba(232,160,32,.5),0 8px 40px rgba(0,0,0,.5)",
        animation: "spin 8s linear infinite", marginBottom: 14,
        display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        <div style={{
          width: "100%", height: "100%", borderRadius: "50%",
          background: "#0d1b3e", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 40, animation: "spinrev 8s linear infinite"
        }}>🏫</div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes spinrev { to { transform: rotate(-360deg) } }
        @keyframes mqscroll { 0% { transform: translateX(0) } 100% { transform: translateX(-50%) } }
      `}</style>

      <div style={{ fontSize: 17, fontWeight: 900, color: "#f5c860", textAlign: "center", marginBottom: 4, fontFamily: "Georgia, serif" }}>FC Public School and College</div>
      <div style={{ fontSize: 11, color: "#cbd5e1", textAlign: "center", marginBottom: 4, fontFamily: "Georgia, serif" }}>Kohlu, Balochistan</div>
      <div style={{ fontSize: 9, color: "#64748b", letterSpacing: "2.5px", fontWeight: 700, marginBottom: 24, fontFamily: "Georgia, serif" }}>SCHOOL MANAGEMENT SYSTEM</div>

      {/* Marquee */}
      <div style={{ overflow: "hidden", width: "100%", maxWidth: 400, background: "rgba(232,160,32,.14)", borderRadius: 6, border: "1px solid rgba(232,160,32,.22)", marginBottom: 20 }}>
        <div style={{ display: "inline-flex", animation: "mqscroll 22s linear infinite", whiteSpace: "nowrap" }}>
          {[1, 2].map(i => <span key={i} style={{ fontSize: 11, color: "#f5c860", fontWeight: 700, padding: "4px 20px" }}>📚 FC Public School Kohlu &nbsp;&nbsp; Excellence in Education &nbsp;&nbsp; Welcome to our School Management System &nbsp;&nbsp;</span>)}
        </div>
      </div>

      {/* Card */}
      <div style={{
        background: "rgba(255,255,255,.07)", backdropFilter: "blur(14px)",
        border: "1px solid rgba(255,255,255,.13)", borderRadius: 22, padding: "26px 22px",
        width: "100%", maxWidth: 400, boxShadow: "0 24px 64px rgba(0,0,0,.35)"
      }}>
        <div style={{ fontWeight: 900, fontSize: 20, color: "#fff", marginBottom: 4, textAlign: "center", fontFamily: "Georgia, serif" }}>
          {mode === "login" ? "Welcome Back" : "Create Account"}
        </div>
        <div style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", marginBottom: 22, fontFamily: "Georgia, serif" }}>
          {mode === "login" ? "Enter your email and password" : "Register as a teacher"}
        </div>

        {err && <div style={{ background: "rgba(220,38,38,.2)", border: "1px solid rgba(239,68,68,.45)", borderRadius: 10, padding: "11px 14px", fontSize: 13, color: "#fca5a5", marginBottom: 14, fontWeight: 600, textAlign: "center", fontFamily: "Georgia, serif" }}>{err}</div>}
        {ok && <div style={{ background: "rgba(22,163,74,.18)", border: "1px solid rgba(34,197,94,.4)", borderRadius: 10, padding: "11px 14px", fontSize: 13, color: "#86efac", marginBottom: 14, fontWeight: 600, textAlign: "center", fontFamily: "Georgia, serif" }}>{ok}</div>}

        {mode === "register" && (
          <>
            <input style={{ ...authInp }} placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} />
            <select style={{ ...authInp }} value={gender} onChange={e => setGender(e.target.value)}>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </>
        )}
        <input style={{ ...authInp }} type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && (mode === "login" ? login() : register())} />
        <div style={{ position: "relative", marginBottom: 12 }}>
          <input style={{ ...authInp, marginBottom: 0, paddingRight: 60 }} type={showPw ? "text" : "password"} placeholder="Password" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === "Enter" && (mode === "login" ? login() : null)} />
          <button onClick={() => setShowPw(p => !p)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "Georgia, serif" }}>{showPw ? "Hide" : "Show"}</button>
        </div>
        {mode === "register" && (
          <input style={{ ...authInp }} type="password" placeholder="Confirm Password" value={pass2} onChange={e => setPass2(e.target.value)} />
        )}

        <button onClick={mode === "login" ? login : register} style={{
          width: "100%", padding: 14, border: "none", borderRadius: 12,
          background: "linear-gradient(135deg,#c87d10,#e8a020,#f5c860)",
          color: "#0d1b3e", fontWeight: 900, fontSize: 15, cursor: "pointer",
          fontFamily: "Georgia, serif", boxShadow: "0 4px 20px rgba(232,160,32,.4)",
          marginTop: 4
        }}>{mode === "login" ? "Sign In" : "Create Account"}</button>

        <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "#94a3b8", fontFamily: "Georgia, serif" }}>
          {mode === "login" ? (
            <span>New teacher? <span onClick={() => { setMode("register"); setErr(""); setOk(""); }} style={{ color: "#f5c860", cursor: "pointer", fontWeight: 700, borderBottom: "1px dashed rgba(245,200,96,.4)" }}>Register here</span></span>
          ) : (
            <span>Already have an account? <span onClick={() => { setMode("login"); setErr(""); setOk(""); }} style={{ color: "#f5c860", cursor: "pointer", fontWeight: 700, borderBottom: "1px dashed rgba(245,200,96,.4)" }}>Sign in</span></span>
          )}
        </div>
      </div>
    </div>
  );
}
const authInp = {
  width: "100%", padding: "13px 16px", borderRadius: 12, border: "1.5px solid rgba(255,255,255,.15)",
  background: "rgba(255,255,255,.08)", color: "#fff", fontSize: 14, outline: "none",
  marginBottom: 12, fontFamily: "Georgia, serif", boxSizing: "border-box",
};

// ═══════════════════════════════════════════════════════════════
// HEADER
// ═══════════════════════════════════════════════════════════════
function Header({ user, onLogout }) {
  const title = user.title || (user.gender === "Female" ? "Mrs." : "Mr.");
  const nm = user.profileName || user.name || "Teacher";
  const display = nm.toLowerCase().startsWith(title.toLowerCase().replace(".", "")) ? nm : `${title} ${nm}`;
  const short = display.split(" ").slice(0, 2).join(" ");

  return (
    <div style={{ background: "linear-gradient(135deg,#0d1b3e,#163680)", padding: "10px 14px 6px", flexShrink: 0, boxShadow: "0 2px 14px rgba(13,27,62,.4)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", border: "2.5px solid #e8a020", background: "#163680", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, boxShadow: "0 0 12px rgba(232,160,32,.4)", flexShrink: 0 }}>🏫</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: "#f5c860", lineHeight: 1.2, fontFamily: "Georgia, serif" }}>FC Public School and College</div>
          <div style={{ fontSize: 9, color: "#94a3b8", letterSpacing: "1.5px", fontWeight: 700, marginTop: 1, fontFamily: "Georgia, serif" }}>KOHLU, BALOCHISTAN</div>
        </div>
        <button onClick={onLogout} style={{
          background: "rgba(232,160,32,.18)", border: "1px solid rgba(232,160,32,.35)",
          borderRadius: 20, padding: "5px 12px", fontSize: 11, color: "#f5c860",
          fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "Georgia, serif"
        }}>{short}</button>
      </div>
      {/* Marquee */}
      <div style={{ overflow: "hidden", background: "rgba(232,160,32,.14)", borderRadius: 4, border: "1px solid rgba(232,160,32,.22)" }}>
        <div style={{ display: "inline-flex", animation: "mqscroll 22s linear infinite", whiteSpace: "nowrap" }}>
          {[1, 2].map(i => <span key={i} style={{ fontSize: 10, color: "#f5c860", fontWeight: 700, padding: "3px 16px" }}>📚 FC Public School Kohlu &nbsp;&nbsp; Excellence in Education &nbsp;&nbsp;</span>)}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// BOTTOM NAV
// ═══════════════════════════════════════════════════════════════
function BottomNav({ tabs, active, onChange }) {
  return (
    <div style={{ background: "#0d1b3e", display: "flex", borderTop: "2.5px solid #e8a020", flexShrink: 0 }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{
          flex: 1, padding: "7px 0 5px", border: "none", cursor: "pointer",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 1,
          background: active === t.id ? "#163680" : "transparent",
          color: active === t.id ? "#f5c860" : "#64748b",
          borderTop: active === t.id ? "2.5px solid #e8a020" : "2.5px solid transparent",
          marginTop: -2.5, fontFamily: "Georgia, serif"
        }}>
          <span style={{ fontSize: 16, lineHeight: 1.2 }}>{t.icon}</span>
          <span style={{ fontSize: 9, fontWeight: 700 }}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════════════════════════
let toastTimeout;
function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div style={{
      position: "fixed", bottom: 88, left: "50%", transform: "translateX(-50%)",
      background: "#0d1b3e", color: "#f5c860", padding: "10px 22px", borderRadius: 30,
      fontSize: 13, fontWeight: 700, zIndex: 200, whiteSpace: "nowrap",
      fontFamily: "Georgia, serif", boxShadow: "0 4px 16px rgba(0,0,0,.3)"
    }}>{msg}</div>
  );
}

// ═══════════════════════════════════════════════════════════════
// HOME TAB
// ═══════════════════════════════════════════════════════════════
function HomeTab({ user, data }) {
  const nowStr = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const dateStr = new Date().toLocaleDateString("en-PK", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const role = user.role === "principal" ? "Principal" : user.role === "sectionhead" ? `${user.wing} Section Head` : "Teacher";
  const title = user.title || (user.gender === "Female" ? "Mrs." : "Mr.");
  const nm = user.profileName || user.name || "";
  const display = nm.toLowerCase().startsWith(title.toLowerCase().replace(".", "")) ? nm : `${title} ${nm}`;

  const stats = [
    { v: (data.students || []).length, l: "STUDENTS", color: "#e8a020", tab: null },
    { v: (data.classes || []).length, l: "CLASSES", color: "#163680", tab: null },
    { v: (data.subjects || []).length, l: "SUBJECTS", color: "#7c3aed", tab: null },
  ];

  return (
    <div style={{ padding: 16 }}>
      {/* Welcome card */}
      <div style={{ background: "linear-gradient(135deg,#163680,#0d1b3e)", borderRadius: 14, padding: "16px", marginBottom: 12, borderLeft: "4px solid #e8a020" }}>
        <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, letterSpacing: "1px", marginBottom: 4, fontFamily: "Georgia, serif" }}>WELCOME BACK</div>
        <div style={{ fontSize: 18, fontWeight: 900, color: "#f5c860", marginBottom: 2, fontFamily: "Georgia, serif" }}>{display}</div>
        <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8, fontFamily: "Georgia, serif" }}>{role}</div>
        <div style={{ fontSize: 12, color: "#cbd5e1", fontFamily: "Georgia, serif" }}>🕐 {nowStr} &nbsp;&nbsp; 📅 {dateStr}</div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
        {stats.map((s, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 14, padding: "10px 4px 7px", textAlign: "center", boxShadow: "0 2px 8px rgba(13,27,62,.08)", border: "1px solid #dde3f0", borderTop: `3px solid ${s.color}` }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: s.color, fontFamily: "Georgia, serif" }}>{s.v}</div>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#6b7a99", letterSpacing: ".8px", marginTop: 2, fontFamily: "Georgia, serif" }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Notifications */}
      {(data.notifications || []).length > 0 && (
        <div style={S.card}>
          <div style={{ fontWeight: 800, fontSize: 14, color: "#0d1b3e", marginBottom: 10, fontFamily: "Georgia, serif" }}>🔔 Notifications</div>
          {(data.notifications || []).slice(0, 3).map((n, i) => (
            <div key={i} style={{ background: "#f8faff", borderRadius: 8, padding: "8px 10px", marginBottom: 6, borderLeft: "3px solid #e8a020" }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: "#0d1b3e", fontFamily: "Georgia, serif" }}>{n.title}</div>
              <div style={{ fontSize: 11, color: "#6b7a99", fontFamily: "Georgia, serif" }}>{n.body}</div>
            </div>
          ))}
        </div>
      )}

      {/* Quick info */}
      <div style={S.card}>
        <div style={{ fontWeight: 800, fontSize: 14, color: "#0d1b3e", marginBottom: 10, fontFamily: "Georgia, serif" }}>📋 Quick Info</div>
        <InfoRow label="School" value="FC Public School & College" />
        <InfoRow label="Location" value="Kohlu, Balochistan" />
        <InfoRow label="Session" value={new Date().getFullYear()} />
        <InfoRow label="Your Role" value={role} />
      </div>

      {/* Tasks */}
      {(data.tasks || []).filter(t => !t.done).length > 0 && (
        <div style={S.card}>
          <div style={{ fontWeight: 800, fontSize: 14, color: "#0d1b3e", marginBottom: 10, fontFamily: "Georgia, serif" }}>✅ Pending Tasks</div>
          {(data.tasks || []).filter(t => !t.done).slice(0, 3).map((t, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 14 }}>📌</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 12, color: "#0d1b3e", fontFamily: "Georgia, serif" }}>{t.title}</div>
                {t.due && <div style={{ fontSize: 10, color: "#6b7a99", fontFamily: "Georgia, serif" }}>Due: {t.due}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #f0f3f9" }}>
      <span style={{ fontSize: 12, color: "#6b7a99", fontWeight: 700, fontFamily: "Georgia, serif" }}>{label}</span>
      <span style={{ fontSize: 12, color: "#0d1b3e", fontWeight: 600, fontFamily: "Georgia, serif" }}>{value}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// STUDENTS TAB
// ═══════════════════════════════════════════════════════════════
function StudentsTab({ data, setData, toast }) {
  const [search, setSearch] = useState("");
  const [selClass, setSelClass] = useState("");
  const [modal, setModal] = useState(null); // null | "add" | student object
  const [form, setForm] = useState({ name: "", fatherName: "", classId: "", rollNo: "", gender: "Male", dob: "", contact: "" });

  const students = data.students || [];
  const classes = data.classes || [];

  const filtered = students.filter(s => {
    const q = search.toLowerCase();
    const matchQ = !q || s.name.toLowerCase().includes(q) || (s.fatherName || "").toLowerCase().includes(q) || String(s.rollNo || "").includes(q);
    const matchC = !selClass || s.classId === selClass;
    return matchQ && matchC;
  });

  const openAdd = () => { setForm({ name: "", fatherName: "", classId: classes[0]?.id || "", rollNo: "", gender: "Male", dob: "", contact: "" }); setModal("add"); };
  const openEdit = (s) => { setForm({ ...s }); setModal(s); };
  const cls = (id) => classes.find(c => c.id === id);

  const save = () => {
    if (!form.name.trim()) return toast("Enter student name");
    if (!form.classId) return toast("Select a class");
    const newStudents = modal === "add"
      ? [...students, { ...form, id: uid(), createdAt: tod() }]
      : students.map(s => s.id === modal.id ? { ...s, ...form } : s);
    setData(d => ({ ...d, students: newStudents }));
    setModal(null);
    toast(modal === "add" ? "Student added ✓" : "Student updated ✓");
  };

  const del = (id) => {
    if (!window.confirm("Delete this student?")) return;
    setData(d => ({ ...d, students: d.students.filter(s => s.id !== id) }));
    toast("Student deleted");
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontWeight: 900, fontSize: 17, color: "#0d1b3e", fontFamily: "Georgia, serif" }}>👨‍🎓 Students</div>
        <button onClick={openAdd} style={{ ...S.btn, background: "#0d1b3e", color: "#fff" }}>+ Add</button>
      </div>

      <input style={{ ...S.inp, marginBottom: 10 }} placeholder="🔍 Search by name, father, roll..." value={search} onChange={e => setSearch(e.target.value)} />

      {classes.length > 0 && (
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 14, scrollbarWidth: "none" }}>
          <button onClick={() => setSelClass("")} style={{ ...chipStyle(!selClass) }}>All</button>
          {classes.map(c => <button key={c.id} onClick={() => setSelClass(c.id)} style={{ ...chipStyle(selClass === c.id) }}>{c.name} {c.section}</button>)}
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState icon="👨‍🎓" title="No Students" sub={search ? "No results found" : "Add your first student"} />
      ) : (
        filtered.map(s => (
          <div key={s.id} style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: "#0d1b3e", fontFamily: "Georgia, serif" }}>{s.name}</div>
                <div style={{ fontSize: 12, color: "#6b7a99", fontFamily: "Georgia, serif" }}>S/O {s.fatherName || "—"}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                  {cls(s.classId) && <span style={tagStyle("#e8ecf5", "#0d1b3e")}>{cls(s.classId).name} {cls(s.classId).section}</span>}
                  {s.rollNo && <span style={tagStyle("#f0f7ff", "#163680")}>Roll #{s.rollNo}</span>}
                  <span style={tagStyle(s.gender === "Female" ? "#fdf2f8" : "#eff6ff", s.gender === "Female" ? "#9d174d" : "#1d4ed8")}>{s.gender}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => openEdit(s)} style={{ ...S.btn, background: "#eff2ff", color: "#163680", padding: "6px 10px" }}>✏️</button>
                <button onClick={() => del(s.id)} style={{ ...S.btn, background: "#fff0f0", color: "#dc2626", padding: "6px 10px" }}>🗑️</button>
              </div>
            </div>
          </div>
        ))
      )}

      {/* Modal */}
      {modal !== null && (
        <Modal title={modal === "add" ? "Add Student" : "Edit Student"} onClose={() => setModal(null)}>
          <FormField label="Full Name *"><input style={S.inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></FormField>
          <FormField label="Father's Name"><input style={S.inp} value={form.fatherName} onChange={e => setForm(f => ({ ...f, fatherName: e.target.value }))} /></FormField>
          <FormField label="Class *">
            <select style={S.inp} value={form.classId} onChange={e => setForm(f => ({ ...f, classId: e.target.value }))}>
              <option value="">Select Class</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name} {c.section}</option>)}
            </select>
          </FormField>
          <FormField label="Roll Number"><input style={S.inp} value={form.rollNo} onChange={e => setForm(f => ({ ...f, rollNo: e.target.value }))} /></FormField>
          <FormField label="Gender">
            <select style={S.inp} value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </FormField>
          <FormField label="Date of Birth"><input style={S.inp} type="date" value={form.dob} onChange={e => setForm(f => ({ ...f, dob: e.target.value }))} /></FormField>
          <FormField label="Contact"><input style={S.inp} value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} /></FormField>
          <button onClick={save} style={{ ...S.btn, background: "#0d1b3e", color: "#fff", width: "100%", padding: 13, fontSize: 15, marginTop: 4 }}>Save Student</button>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ATTENDANCE TAB
// ═══════════════════════════════════════════════════════════════
function AttendanceTab({ data, setData, toast }) {
  const [selClass, setSelClass] = useState(data.classes?.[0]?.id || "");
  const [date, setDate] = useState(tod());
  const [attendance, setAttendance] = useState({});

  const students = (data.students || []).filter(s => s.classId === selClass);
  const cls = (data.classes || []).find(c => c.id === selClass);
  const key = `att-${selClass}-${date}`;

  useEffect(() => {
    const saved = (data.attendance || {})[key] || {};
    const init = {};
    students.forEach(s => { init[s.id] = saved[s.id] || "P"; });
    setAttendance(init);
  }, [selClass, date, data.students?.length]);

  const setAll = (v) => { const a = {}; students.forEach(s => { a[s.id] = v; }); setAttendance(a); };

  const save = () => {
    setData(d => ({ ...d, attendance: { ...(d.attendance || {}), [key]: attendance } }));
    toast("Attendance saved ✓");
  };

  const statusColor = { P: "#16a34a", A: "#dc2626", L: "#d97706", H: "#7c3aed" };
  const present = Object.values(attendance).filter(v => v === "P").length;
  const absent = Object.values(attendance).filter(v => v === "A").length;

  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontWeight: 900, fontSize: 17, color: "#0d1b3e", marginBottom: 14, fontFamily: "Georgia, serif" }}>📋 Attendance</div>

      <div style={S.card}>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <div style={{ flex: 2 }}>
            <span style={lblStyle}>Class</span>
            <select style={S.inp} value={selClass} onChange={e => setSelClass(e.target.value)}>
              {(data.classes || []).map(c => <option key={c.id} value={c.id}>{c.name} {c.section}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <span style={lblStyle}>Date</span>
            <input style={S.inp} type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </div>
        {cls && <div style={{ fontSize: 12, color: "#6b7a99", marginBottom: 8, fontFamily: "Georgia, serif" }}>📚 {cls.name} {cls.section} — {students.length} students</div>}
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          {["P", "A", "L", "H"].map(v => (
            <button key={v} onClick={() => setAll(v)} style={{ ...S.btn, flex: 1, padding: "6px 0", background: v === "P" ? "#dcfce7" : v === "A" ? "#fee2e2" : v === "L" ? "#fef9c3" : "#f3e8ff", color: statusColor[v], fontSize: 11 }}>All {v}</button>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 10 }}>
          <StatBox v={present} l="Present" color="#16a34a" />
          <StatBox v={absent} l="Absent" color="#dc2626" />
          <StatBox v={students.length - present - absent} l="Other" color="#d97706" />
        </div>
      </div>

      {students.length === 0 ? (
        <EmptyState icon="📋" title="No Students" sub="Add students to this class first" />
      ) : (
        students.map(s => (
          <div key={s.id} style={{ ...S.card, marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#0d1b3e", fontFamily: "Georgia, serif" }}>{s.name}</div>
                {s.rollNo && <div style={{ fontSize: 11, color: "#6b7a99", fontFamily: "Georgia, serif" }}>Roll #{s.rollNo}</div>}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {["P", "A", "L", "H"].map(v => (
                  <button key={v} onClick={() => setAttendance(a => ({ ...a, [s.id]: v }))} style={{
                    ...S.btn, padding: "5px 8px", fontSize: 11, minWidth: 28,
                    background: attendance[s.id] === v ? (v === "P" ? "#16a34a" : v === "A" ? "#dc2626" : v === "L" ? "#d97706" : "#7c3aed") : "#e8ecf5",
                    color: attendance[s.id] === v ? "#fff" : "#6b7a99"
                  }}>{v}</button>
                ))}
              </div>
            </div>
          </div>
        ))
      )}

      {students.length > 0 && (
        <button onClick={save} style={{ ...S.btn, background: "#e8a020", color: "#0d1b3e", width: "100%", padding: 13, fontSize: 15, marginTop: 4 }}>💾 Save Attendance</button>
      )}
    </div>
  );
}

function StatBox({ v, l, color }) {
  return (
    <div style={{ background: "#f8faff", borderRadius: 8, padding: "6px 4px", textAlign: "center" }}>
      <div style={{ fontSize: 18, fontWeight: 900, color, fontFamily: "Georgia, serif" }}>{v}</div>
      <div style={{ fontSize: 9, color: "#6b7a99", fontWeight: 700, fontFamily: "Georgia, serif" }}>{l}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MARKS TAB
// ═══════════════════════════════════════════════════════════════
function MarksTab({ data, setData, toast }) {
  const [selClass, setSelClass] = useState(data.classes?.[0]?.id || "");
  const [exam, setExam] = useState("Monthly Test 1");
  const [marks, setMarks] = useState({});
  const [modal, setModal] = useState(false);

  const students = (data.students || []).filter(s => s.classId === selClass);
  const subjects = (data.subjects || []).filter(s => s.classId === selClass);
  const key = `marks-${selClass}-${exam}`;

  const EXAMS = ["Monthly Test 1", "Monthly Test 2", "Mid Term", "Monthly Test 3", "Monthly Test 4", "Final Exam"];

  useEffect(() => {
    const saved = (data.marks || {})[key] || {};
    setMarks(saved);
  }, [selClass, exam]);

  const setMark = (stuId, subId, val) => {
    setMarks(m => ({ ...m, [`${stuId}-${subId}`]: val }));
  };

  const save = () => {
    setData(d => ({ ...d, marks: { ...(d.marks || {}), [key]: marks } }));
    toast("Marks saved ✓");
  };

  const getPct = (stuId) => {
    if (!subjects.length) return 0;
    const total = subjects.reduce((acc, s) => acc + (s.totalMarks || 100), 0);
    const obtained = subjects.reduce((acc, s) => acc + (parseFloat(marks[`${stuId}-${s.id}`]) || 0), 0);
    return total ? Math.round(obtained / total * 100) : 0;
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontWeight: 900, fontSize: 17, color: "#0d1b3e", marginBottom: 14, fontFamily: "Georgia, serif" }}>📝 Marks</div>

      <div style={S.card}>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <div style={{ flex: 1 }}>
            <span style={lblStyle}>Class</span>
            <select style={S.inp} value={selClass} onChange={e => setSelClass(e.target.value)}>
              {(data.classes || []).map(c => <option key={c.id} value={c.id}>{c.name} {c.section}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <span style={lblStyle}>Exam</span>
            <select style={S.inp} value={exam} onChange={e => setExam(e.target.value)}>
              {EXAMS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
        </div>
        {subjects.length === 0 && <div style={{ fontSize: 12, color: "#dc2626", fontFamily: "Georgia, serif" }}>⚠️ No subjects for this class. Add subjects first.</div>}
      </div>

      {students.length === 0 ? (
        <EmptyState icon="📝" title="No Students" sub="Add students to this class first" />
      ) : subjects.length > 0 ? (
        <>
          {students.map(s => (
            <div key={s.id} style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: "#0d1b3e", fontFamily: "Georgia, serif" }}>{s.name}</div>
                <span style={{ fontSize: 12, fontWeight: 900, color: getPct(s.id) >= 50 ? "#16a34a" : "#dc2626", fontFamily: "Georgia, serif" }}>{getPct(s.id)}%</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {subjects.map(sub => (
                  <div key={sub.id} style={{ background: "#f8faff", borderRadius: 6, padding: "4px 8px" }}>
                    <div style={{ fontSize: 10, color: "#6b7a99", fontWeight: 700, fontFamily: "Georgia, serif" }}>{sub.name} /{sub.totalMarks || 100}</div>
                    <input
                      style={{ ...S.inp, padding: "4px 6px", fontSize: 13, background: "transparent", border: "none", borderBottom: "1px solid #dde3f0", borderRadius: 0 }}
                      type="number" min="0" max={sub.totalMarks || 100}
                      value={marks[`${s.id}-${sub.id}`] || ""}
                      onChange={e => setMark(s.id, sub.id, e.target.value)}
                      placeholder="—"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <button onClick={save} style={{ ...S.btn, background: "#e8a020", color: "#0d1b3e", width: "100%", padding: 13, fontSize: 15, marginTop: 4 }}>💾 Save Marks</button>
        </>
      ) : null}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MORE TAB (Classes, Subjects, Timetable, Tasks, Syllabus)
// ═══════════════════════════════════════════════════════════════
function MoreTab({ data, setData, toast, user }) {
  const [page, setPage] = useState("menu");

  if (page === "classes") return <ClassesPage data={data} setData={setData} toast={toast} onBack={() => setPage("menu")} />;
  if (page === "subjects") return <SubjectsPage data={data} setData={setData} toast={toast} onBack={() => setPage("menu")} />;
  if (page === "tasks") return <TasksPage data={data} setData={setData} toast={toast} onBack={() => setPage("menu")} />;
  if (page === "syllabus") return <SyllabusPage data={data} setData={setData} toast={toast} onBack={() => setPage("menu")} />;
  if (page === "notifications") return <NotificationsPage data={data} setData={setData} toast={toast} onBack={() => setPage("menu")} />;

  const items = [
    { id: "classes", icon: "🏫", label: "Classes", sub: `${(data.classes || []).length} classes` },
    { id: "subjects", icon: "📚", label: "Subjects", sub: `${(data.subjects || []).length} subjects` },
    { id: "tasks", icon: "✅", label: "Tasks", sub: `${(data.tasks || []).filter(t => !t.done).length} pending` },
    { id: "syllabus", icon: "📖", label: "Syllabus", sub: `${(data.syllabus || []).length} entries` },
    { id: "notifications", icon: "🔔", label: "Notifications", sub: `${(data.notifications || []).length} total` },
  ];

  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontWeight: 900, fontSize: 17, color: "#0d1b3e", marginBottom: 14, fontFamily: "Georgia, serif" }}>⚙️ More</div>
      {items.map(item => (
        <div key={item.id} onClick={() => setPage(item.id)} style={{ ...S.card, cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 28 }}>{item.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: "#0d1b3e", fontFamily: "Georgia, serif" }}>{item.label}</div>
            <div style={{ fontSize: 11, color: "#6b7a99", fontFamily: "Georgia, serif" }}>{item.sub}</div>
          </div>
          <span style={{ color: "#6b7a99", fontSize: 16 }}>›</span>
        </div>
      ))}
    </div>
  );
}

// ── Classes ──────────────────────────────────────────────────
function ClassesPage({ data, setData, toast, onBack }) {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: "", section: "" });

  const classes = data.classes || [];
  const save = () => {
    if (!form.name.trim()) return toast("Enter class name");
    const newClasses = modal === "add" ? [...classes, { ...form, id: uid() }] : classes.map(c => c.id === modal.id ? { ...c, ...form } : c);
    setData(d => ({ ...d, classes: newClasses }));
    setModal(null);
    toast(modal === "add" ? "Class added ✓" : "Class updated ✓");
  };
  const del = (id) => { if (!window.confirm("Delete class?")) return; setData(d => ({ ...d, classes: d.classes.filter(c => c.id !== id) })); toast("Deleted"); };
  const openAdd = () => { setForm({ name: "", section: "A" }); setModal("add"); };
  const openEdit = (c) => { setForm({ name: c.name, section: c.section }); setModal(c); };

  return (
    <div style={{ padding: 16 }}>
      <BackHeader title="🏫 Classes" onBack={onBack} onAdd={openAdd} />
      {classes.length === 0 ? <EmptyState icon="🏫" title="No Classes" sub="Add your first class" /> :
        classes.map(c => (
          <div key={c.id} style={{ ...S.card, display: "flex", alignItems: "center" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: "#0d1b3e", fontFamily: "Georgia, serif" }}>{c.name}</div>
              <div style={{ fontSize: 11, color: "#6b7a99", fontFamily: "Georgia, serif" }}>Section: {c.section || "—"}</div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => openEdit(c)} style={{ ...S.btn, background: "#eff2ff", color: "#163680", padding: "6px 10px" }}>✏️</button>
              <button onClick={() => del(c.id)} style={{ ...S.btn, background: "#fff0f0", color: "#dc2626", padding: "6px 10px" }}>🗑️</button>
            </div>
          </div>
        ))
      }
      {modal !== null && (
        <Modal title={modal === "add" ? "Add Class" : "Edit Class"} onClose={() => setModal(null)}>
          <FormField label="Class Name *"><input style={S.inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Class 5" /></FormField>
          <FormField label="Section"><input style={S.inp} value={form.section} onChange={e => setForm(f => ({ ...f, section: e.target.value }))} placeholder="e.g. A" /></FormField>
          <button onClick={save} style={{ ...S.btn, background: "#0d1b3e", color: "#fff", width: "100%", padding: 13, fontSize: 15 }}>Save</button>
        </Modal>
      )}
    </div>
  );
}

// ── Subjects ─────────────────────────────────────────────────
function SubjectsPage({ data, setData, toast, onBack }) {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: "", classId: "", totalMarks: 100, passingMarks: 40 });
  const subjects = data.subjects || [];
  const classes = data.classes || [];

  const save = () => {
    if (!form.name.trim()) return toast("Enter subject name");
    const newSubjects = modal === "add" ? [...subjects, { ...form, id: uid() }] : subjects.map(s => s.id === modal.id ? { ...s, ...form } : s);
    setData(d => ({ ...d, subjects: newSubjects }));
    setModal(null);
    toast(modal === "add" ? "Subject added ✓" : "Updated ✓");
  };
  const del = (id) => { if (!window.confirm("Delete subject?")) return; setData(d => ({ ...d, subjects: d.subjects.filter(s => s.id !== id) })); toast("Deleted"); };
  const openAdd = () => { setForm({ name: "", classId: classes[0]?.id || "", totalMarks: 100, passingMarks: 40 }); setModal("add"); };
  const openEdit = (s) => { setForm({ name: s.name, classId: s.classId, totalMarks: s.totalMarks || 100, passingMarks: s.passingMarks || 40 }); setModal(s); };
  const cls = (id) => classes.find(c => c.id === id);

  return (
    <div style={{ padding: 16 }}>
      <BackHeader title="📚 Subjects" onBack={onBack} onAdd={openAdd} />
      {subjects.length === 0 ? <EmptyState icon="📚" title="No Subjects" sub="Add your first subject" /> :
        subjects.map(s => (
          <div key={s.id} style={{ ...S.card, display: "flex", alignItems: "center" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: "#0d1b3e", fontFamily: "Georgia, serif" }}>{s.name}</div>
              <div style={{ fontSize: 11, color: "#6b7a99", fontFamily: "Georgia, serif" }}>{cls(s.classId) ? `${cls(s.classId).name} ${cls(s.classId).section}` : "All classes"} • TM: {s.totalMarks} PM: {s.passingMarks}</div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => openEdit(s)} style={{ ...S.btn, background: "#eff2ff", color: "#163680", padding: "6px 10px" }}>✏️</button>
              <button onClick={() => del(s.id)} style={{ ...S.btn, background: "#fff0f0", color: "#dc2626", padding: "6px 10px" }}>🗑️</button>
            </div>
          </div>
        ))
      }
      {modal !== null && (
        <Modal title={modal === "add" ? "Add Subject" : "Edit Subject"} onClose={() => setModal(null)}>
          <FormField label="Subject Name *"><input style={S.inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></FormField>
          <FormField label="Class">
            <select style={S.inp} value={form.classId} onChange={e => setForm(f => ({ ...f, classId: e.target.value }))}>
              <option value="">All Classes</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name} {c.section}</option>)}
            </select>
          </FormField>
          <FormField label="Total Marks"><input style={S.inp} type="number" value={form.totalMarks} onChange={e => setForm(f => ({ ...f, totalMarks: e.target.value }))} /></FormField>
          <FormField label="Passing Marks"><input style={S.inp} type="number" value={form.passingMarks} onChange={e => setForm(f => ({ ...f, passingMarks: e.target.value }))} /></FormField>
          <button onClick={save} style={{ ...S.btn, background: "#0d1b3e", color: "#fff", width: "100%", padding: 13, fontSize: 15 }}>Save</button>
        </Modal>
      )}
    </div>
  );
}

// ── Tasks ─────────────────────────────────────────────────────
function TasksPage({ data, setData, toast, onBack }) {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ title: "", due: "", priority: "Normal" });
  const tasks = data.tasks || [];

  const save = () => {
    if (!form.title.trim()) return toast("Enter task title");
    const newTasks = modal === "add" ? [...tasks, { ...form, id: uid(), done: false, createdAt: tod() }] : tasks.map(t => t.id === modal.id ? { ...t, ...form } : t);
    setData(d => ({ ...d, tasks: newTasks }));
    setModal(null);
    toast(modal === "add" ? "Task added ✓" : "Updated ✓");
  };
  const toggle = (id) => { setData(d => ({ ...d, tasks: d.tasks.map(t => t.id === id ? { ...t, done: !t.done } : t) })); };
  const del = (id) => { if (!window.confirm("Delete task?")) return; setData(d => ({ ...d, tasks: d.tasks.filter(t => t.id !== id) })); };
  const openAdd = () => { setForm({ title: "", due: "", priority: "Normal" }); setModal("add"); };

  const pending = tasks.filter(t => !t.done);
  const done = tasks.filter(t => t.done);

  return (
    <div style={{ padding: 16 }}>
      <BackHeader title="✅ Tasks" onBack={onBack} onAdd={openAdd} />
      {tasks.length === 0 && <EmptyState icon="✅" title="No Tasks" sub="Add your first task" />}
      {pending.length > 0 && <>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7a99", letterSpacing: "1.2px", marginBottom: 8, fontFamily: "Georgia, serif" }}>PENDING ({pending.length})</div>
        {pending.map(t => <TaskCard key={t.id} task={t} onToggle={toggle} onDel={del} />)}
      </>}
      {done.length > 0 && <>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7a99", letterSpacing: "1.2px", marginBottom: 8, marginTop: 10, fontFamily: "Georgia, serif" }}>DONE ({done.length})</div>
        {done.map(t => <TaskCard key={t.id} task={t} onToggle={toggle} onDel={del} />)}
      </>}
      {modal !== null && (
        <Modal title="Add Task" onClose={() => setModal(null)}>
          <FormField label="Task Title *"><input style={S.inp} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></FormField>
          <FormField label="Due Date"><input style={S.inp} type="date" value={form.due} onChange={e => setForm(f => ({ ...f, due: e.target.value }))} /></FormField>
          <FormField label="Priority">
            <select style={S.inp} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
              {["Low", "Normal", "High", "Urgent"].map(p => <option key={p}>{p}</option>)}
            </select>
          </FormField>
          <button onClick={save} style={{ ...S.btn, background: "#0d1b3e", color: "#fff", width: "100%", padding: 13, fontSize: 15 }}>Save</button>
        </Modal>
      )}
    </div>
  );
}

function TaskCard({ task, onToggle, onDel }) {
  const priorityColor = { Low: "#6b7a99", Normal: "#163680", High: "#d97706", Urgent: "#dc2626" };
  return (
    <div style={{ ...S.card, opacity: task.done ? 0.6 : 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={() => onToggle(task.id)} style={{ fontSize: 20, background: "none", border: "none", cursor: "pointer" }}>{task.done ? "✅" : "⬜"}</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#0d1b3e", textDecoration: task.done ? "line-through" : "none", fontFamily: "Georgia, serif" }}>{task.title}</div>
          <div style={{ display: "flex", gap: 6, marginTop: 3 }}>
            {task.due && <span style={tagStyle("#f0f7ff", "#163680")}>📅 {task.due}</span>}
            <span style={tagStyle("#f8faff", priorityColor[task.priority] || "#6b7a99")}>{task.priority}</span>
          </div>
        </div>
        <button onClick={() => onDel(task.id)} style={{ ...S.btn, background: "#fff0f0", color: "#dc2626", padding: "5px 8px", fontSize: 12 }}>🗑️</button>
      </div>
    </div>
  );
}

// ── Syllabus ──────────────────────────────────────────────────
function SyllabusPage({ data, setData, toast, onBack }) {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ classId: "", subject: "", topic: "", date: tod(), status: "Pending" });
  const syllabus = data.syllabus || [];
  const classes = data.classes || [];

  const save = () => {
    if (!form.topic.trim()) return toast("Enter topic");
    const newS = modal === "add" ? [...syllabus, { ...form, id: uid() }] : syllabus.map(s => s.id === modal.id ? { ...s, ...form } : s);
    setData(d => ({ ...d, syllabus: newS }));
    setModal(null);
    toast("Saved ✓");
  };
  const del = (id) => { if (!window.confirm("Delete?")) return; setData(d => ({ ...d, syllabus: d.syllabus.filter(s => s.id !== id) })); };
  const openAdd = () => { setForm({ classId: classes[0]?.id || "", subject: "", topic: "", date: tod(), status: "Pending" }); setModal("add"); };
  const cls = (id) => classes.find(c => c.id === id);

  return (
    <div style={{ padding: 16 }}>
      <BackHeader title="📖 Syllabus" onBack={onBack} onAdd={openAdd} />
      {syllabus.length === 0 ? <EmptyState icon="📖" title="No Syllabus" sub="Track your syllabus coverage" /> :
        syllabus.map(s => (
          <div key={s.id} style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: "#0d1b3e", fontFamily: "Georgia, serif" }}>{s.topic}</div>
                <div style={{ fontSize: 11, color: "#6b7a99", fontFamily: "Georgia, serif" }}>{s.subject} • {cls(s.classId) ? `${cls(s.classId).name} ${cls(s.classId).section}` : ""}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                  <span style={tagStyle(s.status === "Done" ? "#f0fdf4" : "#fff7ed", s.status === "Done" ? "#16a34a" : "#d97706")}>{s.status}</span>
                  {s.date && <span style={tagStyle("#f0f7ff", "#163680")}>📅 {s.date}</span>}
                </div>
              </div>
              <button onClick={() => del(s.id)} style={{ ...S.btn, background: "#fff0f0", color: "#dc2626", padding: "5px 8px", alignSelf: "flex-start" }}>🗑️</button>
            </div>
          </div>
        ))
      }
      {modal !== null && (
        <Modal title="Add Syllabus Entry" onClose={() => setModal(null)}>
          <FormField label="Class">
            <select style={S.inp} value={form.classId} onChange={e => setForm(f => ({ ...f, classId: e.target.value }))}>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name} {c.section}</option>)}
            </select>
          </FormField>
          <FormField label="Subject"><input style={S.inp} value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} /></FormField>
          <FormField label="Topic *"><input style={S.inp} value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))} /></FormField>
          <FormField label="Date"><input style={S.inp} type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></FormField>
          <FormField label="Status">
            <select style={S.inp} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              {["Pending", "In Progress", "Done"].map(s => <option key={s}>{s}</option>)}
            </select>
          </FormField>
          <button onClick={save} style={{ ...S.btn, background: "#0d1b3e", color: "#fff", width: "100%", padding: 13, fontSize: 15 }}>Save</button>
        </Modal>
      )}
    </div>
  );
}

// ── Notifications ─────────────────────────────────────────────
function NotificationsPage({ data, setData, toast, onBack }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", type: "Info" });
  const notifs = data.notifications || [];

  const save = () => {
    if (!form.title.trim()) return toast("Enter title");
    setData(d => ({ ...d, notifications: [...(d.notifications || []), { ...form, id: uid(), date: tod() }] }));
    setModal(false);
    toast("Notification added ✓");
  };
  const del = (id) => { setData(d => ({ ...d, notifications: d.notifications.filter(n => n.id !== id) })); };

  const typeColor = { Info: "#163680", Warning: "#d97706", Urgent: "#dc2626", Holiday: "#16a34a" };

  return (
    <div style={{ padding: 16 }}>
      <BackHeader title="🔔 Notifications" onBack={onBack} onAdd={() => { setForm({ title: "", body: "", type: "Info" }); setModal(true); }} />
      {notifs.length === 0 ? <EmptyState icon="🔔" title="No Notifications" sub="Add announcements here" /> :
        notifs.slice().reverse().map(n => (
          <div key={n.id} style={{ ...S.card, borderLeft: `3px solid ${typeColor[n.type] || "#163680"}` }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: "#0d1b3e", fontFamily: "Georgia, serif" }}>{n.title}</div>
                {n.body && <div style={{ fontSize: 12, color: "#6b7a99", marginTop: 3, fontFamily: "Georgia, serif" }}>{n.body}</div>}
                <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4, fontFamily: "Georgia, serif" }}>{n.date}</div>
              </div>
              <button onClick={() => del(n.id)} style={{ ...S.btn, background: "#fff0f0", color: "#dc2626", padding: "5px 8px", alignSelf: "flex-start" }}>🗑️</button>
            </div>
          </div>
        ))
      }
      {modal && (
        <Modal title="Add Notification" onClose={() => setModal(false)}>
          <FormField label="Title *"><input style={S.inp} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></FormField>
          <FormField label="Message"><textarea style={{ ...S.inp, minHeight: 80, resize: "vertical" }} value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} /></FormField>
          <FormField label="Type">
            <select style={S.inp} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              {["Info", "Warning", "Urgent", "Holiday"].map(t => <option key={t}>{t}</option>)}
            </select>
          </FormField>
          <button onClick={save} style={{ ...S.btn, background: "#0d1b3e", color: "#fff", width: "100%", padding: 13, fontSize: 15 }}>Save</button>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PRINCIPAL APP
// ═══════════════════════════════════════════════════════════════
function PrincipalApp({ user, onLogout }) {
  const [tab, setTab] = useState("home");
  const [allData, setAllData] = useState(() => DB.get("fcps-principal-data") || { notifications: [], announcements: [] });
  const [toast, setToast] = useState("");

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }, []);

  useEffect(() => { DB.set("fcps-principal-data", allData); }, [allData]);

  const tabs = [
    { id: "home", icon: "🏠", label: "Home" },
    { id: "reports", icon: "📊", label: "Reports" },
    { id: "notices", icon: "📢", label: "Notices" },
    { id: "profile", icon: "👤", label: "Profile" },
  ];

  const allTeachers = getAccs().filter(a => a.role === "teacher");
  const allStudentCount = Object.values(
    Object.fromEntries(
      Object.keys(localStorage)
        .filter(k => k.startsWith("fcps-data-"))
        .map(k => {
          const d = DB.get(k) || {};
          return [k, (d.students || []).length];
        })
    )
  ).reduce((a, b) => a + b, 0);

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", maxWidth: 480, margin: "0 auto", background: "#f0f3f9" }}>
      <Header user={user} onLogout={onLogout} />
      <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
        {tab === "home" && (
          <div style={{ padding: 16 }}>
            <div style={{ background: "linear-gradient(135deg,#163680,#0d1b3e)", borderRadius: 14, padding: 16, marginBottom: 12, borderLeft: "4px solid #e8a020" }}>
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, letterSpacing: "1px", marginBottom: 4, fontFamily: "Georgia, serif" }}>PRINCIPAL DASHBOARD</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#f5c860", fontFamily: "Georgia, serif" }}>FC Public School & College</div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4, fontFamily: "Georgia, serif" }}>Kohlu, Balochistan</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
              <BigStat v={allTeachers.length} l="Teachers" color="#163680" icon="👨‍🏫" />
              <BigStat v={allStudentCount} l="Students" color="#e8a020" icon="👨‍🎓" />
            </div>
            <div style={S.card}>
              <div style={{ fontWeight: 800, fontSize: 14, color: "#0d1b3e", marginBottom: 10, fontFamily: "Georgia, serif" }}>👨‍🏫 Registered Teachers</div>
              {allTeachers.length === 0 ? <div style={{ fontSize: 12, color: "#6b7a99", fontFamily: "Georgia, serif" }}>No teachers registered yet.</div> :
                allTeachers.map((t, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", padding: "6px 0", borderBottom: "1px solid #f0f3f9" }}>
                    <span style={{ fontSize: 20 }}>👤</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#0d1b3e", fontFamily: "Georgia, serif" }}>{t.title || (t.gender === "Female" ? "Mrs." : "Mr.")} {t.name}</div>
                      <div style={{ fontSize: 11, color: "#6b7a99", fontFamily: "Georgia, serif" }}>{t.email}</div>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        )}
        {tab === "notices" && (
          <div style={{ padding: 16 }}>
            <div style={{ fontWeight: 900, fontSize: 17, color: "#0d1b3e", marginBottom: 14, fontFamily: "Georgia, serif" }}>📢 Notices & Announcements</div>
            <div style={{ fontSize: 12, color: "#6b7a99", background: "#f8faff", borderRadius: 8, padding: "10px 12px", marginBottom: 14, fontFamily: "Georgia, serif" }}>
              Post notices here. Teachers will see them on their home screen.
            </div>
            <button onClick={() => {
              const title = window.prompt("Notice title:");
              const body = window.prompt("Notice message:");
              if (title) {
                setAllData(d => ({ ...d, announcements: [...(d.announcements || []), { id: uid(), title, body, date: tod() }] }));
                showToast("Notice posted ✓");
              }
            }} style={{ ...S.btn, background: "#e8a020", color: "#0d1b3e", marginBottom: 14, width: "100%" }}>+ Post Notice</button>
            {(allData.announcements || []).slice().reverse().map(n => (
              <div key={n.id} style={{ ...S.card, borderLeft: "3px solid #e8a020" }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: "#0d1b3e", fontFamily: "Georgia, serif" }}>{n.title}</div>
                {n.body && <div style={{ fontSize: 12, color: "#6b7a99", marginTop: 3, fontFamily: "Georgia, serif" }}>{n.body}</div>}
                <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4, fontFamily: "Georgia, serif" }}>{n.date}</div>
              </div>
            ))}
          </div>
        )}
        {tab === "profile" && <ProfileTab user={user} onLogout={onLogout} />}
        {tab === "reports" && (
          <div style={{ padding: 16 }}>
            <div style={{ fontWeight: 900, fontSize: 17, color: "#0d1b3e", marginBottom: 14, fontFamily: "Georgia, serif" }}>📊 Reports</div>
            <div style={{ ...S.card, textAlign: "center", padding: 30 }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>📊</div>
              <div style={{ fontWeight: 800, fontSize: 15, color: "#0d1b3e", fontFamily: "Georgia, serif" }}>Reports Dashboard</div>
              <div style={{ fontSize: 12, color: "#6b7a99", marginTop: 6, fontFamily: "Georgia, serif" }}>
                View aggregated attendance, marks, and performance data from all teachers.
              </div>
            </div>
          </div>
        )}
      </div>
      <BottomNav tabs={tabs} active={tab} onChange={setTab} />
      <Toast msg={toast} />
    </div>
  );
}

function BigStat({ v, l, color, icon }) {
  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: "14px 10px", textAlign: "center", boxShadow: "0 2px 8px rgba(13,27,62,.08)", border: "1px solid #dde3f0" }}>
      <div style={{ fontSize: 28, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 26, fontWeight: 900, color, fontFamily: "Georgia, serif" }}>{v}</div>
      <div style={{ fontSize: 10, color: "#6b7a99", fontWeight: 700, fontFamily: "Georgia, serif" }}>{l}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SECTION HEAD APP
// ═══════════════════════════════════════════════════════════════
function SectionHeadApp({ user, onLogout }) {
  const [tab, setTab] = useState("home");

  const tabs = [
    { id: "home", icon: "🏠", label: "Home" },
    { id: "teachers", icon: "👨‍🏫", label: "Teachers" },
    { id: "profile", icon: "👤", label: "Profile" },
  ];

  const wingTeachers = getAccs().filter(a => a.role === "teacher" && (a.wing === user.wing || user.wing === "Senior"));

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", maxWidth: 480, margin: "0 auto", background: "#f0f3f9" }}>
      <Header user={user} onLogout={onLogout} />
      <div style={{ flex: 1, overflowY: "auto" }}>
        {tab === "home" && (
          <div style={{ padding: 16 }}>
            <div style={{ background: "linear-gradient(135deg,#163680,#0d1b3e)", borderRadius: 14, padding: 16, marginBottom: 12, borderLeft: "4px solid #e8a020" }}>
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, letterSpacing: "1px", marginBottom: 4, fontFamily: "Georgia, serif" }}>SECTION HEAD DASHBOARD</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#f5c860", fontFamily: "Georgia, serif" }}>{user.label}</div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4, fontFamily: "Georgia, serif" }}>FC Public School & College</div>
            </div>
            <div style={S.card}>
              <div style={{ fontWeight: 800, fontSize: 14, color: "#0d1b3e", marginBottom: 6, fontFamily: "Georgia, serif" }}>Wing: {user.label}</div>
              <InfoRow label="Section" value={user.wing} />
              <InfoRow label="Teachers in Wing" value={wingTeachers.length} />
            </div>
          </div>
        )}
        {tab === "teachers" && (
          <div style={{ padding: 16 }}>
            <div style={{ fontWeight: 900, fontSize: 17, color: "#0d1b3e", marginBottom: 14, fontFamily: "Georgia, serif" }}>👨‍🏫 Wing Teachers</div>
            {wingTeachers.length === 0 ? <EmptyState icon="👨‍🏫" title="No Teachers" sub="No teachers in this wing yet" /> :
              wingTeachers.map((t, i) => (
                <div key={i} style={S.card}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#0d1b3e", fontFamily: "Georgia, serif" }}>{t.title || "Mr."} {t.name}</div>
                  <div style={{ fontSize: 12, color: "#6b7a99", fontFamily: "Georgia, serif" }}>{t.email}</div>
                </div>
              ))
            }
          </div>
        )}
        {tab === "profile" && <ProfileTab user={user} onLogout={onLogout} />}
      </div>
      <BottomNav tabs={tabs} active={tab} onChange={setTab} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TEACHER APP
// ═══════════════════════════════════════════════════════════════
function TeacherApp({ user, onLogout }) {
  const [tab, setTab] = useState("home");
  const [toast, setToast] = useState("");
  const [data, setDataRaw] = useState(() => {
    const saved = DB.get(`fcps-data-${user.email}`) || {};
    return { students: [], classes: [], subjects: [], attendance: {}, marks: {}, tasks: [], syllabus: [], notifications: [], ...saved };
  });

  const setData = useCallback((updater) => {
    setDataRaw(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      DB.set(`fcps-data-${user.email}`, next);
      return next;
    });
  }, [user.email]);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }, []);

  const tabs = [
    { id: "home", icon: "🏠", label: "Home" },
    { id: "students", icon: "👨‍🎓", label: "Students" },
    { id: "attendance", icon: "📋", label: "Attendance" },
    { id: "marks", icon: "📝", label: "Marks" },
    { id: "more", icon: "⚙️", label: "More" },
  ];

  const renderTab = () => {
    switch (tab) {
      case "home": return <HomeTab user={user} data={data} />;
      case "students": return <StudentsTab data={data} setData={setData} toast={showToast} />;
      case "attendance": return <AttendanceTab data={data} setData={setData} toast={showToast} />;
      case "marks": return <MarksTab data={data} setData={setData} toast={showToast} />;
      case "more": return <MoreTab data={data} setData={setData} toast={showToast} user={user} />;
      default: return null;
    }
  };

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", maxWidth: 480, margin: "0 auto", background: "#f0f3f9" }}>
      <Header user={user} onLogout={onLogout} />
      <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
        {renderTab()}
      </div>
      <BottomNav tabs={tabs} active={tab} onChange={setTab} />
      <Toast msg={toast} />
      <style>{`@keyframes mqscroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}`}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PROFILE TAB
// ═══════════════════════════════════════════════════════════════
function ProfileTab({ user, onLogout }) {
  const title = user.title || (user.gender === "Female" ? "Mrs." : "Mr.");
  const roleLabel = { principal: "Principal", sectionhead: "Section Head", teacher: "Teacher" }[user.role] || "Teacher";
  return (
    <div style={{ padding: 16 }}>
      <div style={{ ...S.card, textAlign: "center", marginBottom: 12 }}>
        <div style={{ width: 70, height: 70, borderRadius: "50%", background: "linear-gradient(135deg,#0d1b3e,#163680)", border: "3px solid #e8a020", margin: "0 auto 10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30 }}>👤</div>
        <div style={{ fontWeight: 900, fontSize: 16, color: "#0d1b3e", fontFamily: "Georgia, serif" }}>{title} {user.name}</div>
        <div style={{ fontSize: 12, color: "#6b7a99", marginTop: 3, fontFamily: "Georgia, serif" }}>{roleLabel}</div>
        <div style={{ fontSize: 11, color: "#94a3b8", fontFamily: "Georgia, serif" }}>{user.email}</div>
      </div>
      <div style={S.card}>
        <InfoRow label="Name" value={`${title} ${user.name}`} />
        <InfoRow label="Email" value={user.email} />
        <InfoRow label="Role" value={roleLabel} />
        <InfoRow label="Gender" value={user.gender || "—"} />
        {user.wing && <InfoRow label="Wing" value={user.wing} />}
        {user.mobile && <InfoRow label="Mobile" value={user.mobile} />}
      </div>
      <button onClick={onLogout} style={{ ...S.btn, background: "#fee2e2", color: "#dc2626", width: "100%", padding: 13, fontSize: 15, marginTop: 4 }}>🚪 Sign Out</button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// REUSABLE COMPONENTS
// ═══════════════════════════════════════════════════════════════
function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(13,27,62,.6)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#fff", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480, maxHeight: "92dvh", overflowY: "auto", paddingBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 20px", borderBottom: "1px solid #dde3f0", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
          <span style={{ fontWeight: 800, fontSize: 16, color: "#0d1b3e", fontFamily: "Georgia, serif" }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#6b7a99" }}>×</button>
        </div>
        <div style={{ padding: "16px 20px" }}>{children}</div>
      </div>
    </div>
  );
}

function EmptyState({ icon, title, sub }) {
  return (
    <div style={{ textAlign: "center", padding: "36px 20px" }}>
      <div style={{ fontSize: 46, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontWeight: 800, fontSize: 15, color: "#0d1b3e", marginBottom: 6, fontFamily: "Georgia, serif" }}>{title}</div>
      <div style={{ fontSize: 12, color: "#6b7a99", fontFamily: "Georgia, serif" }}>{sub}</div>
    </div>
  );
}

function BackHeader({ title, onBack, onAdd }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
      <button onClick={onBack} style={{ ...S.btn, background: "#e8ecf5", color: "#0d1b3e", padding: "6px 12px", fontSize: 12 }}>‹ Back</button>
      <div style={{ fontWeight: 900, fontSize: 17, color: "#0d1b3e", flex: 1, margin: "0 8px", fontFamily: "Georgia, serif" }}>{title}</div>
      {onAdd && <button onClick={onAdd} style={{ ...S.btn, background: "#0d1b3e", color: "#fff", padding: "6px 12px", fontSize: 12 }}>+ Add</button>}
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <span style={lblStyle}>{label}</span>
      {children}
    </div>
  );
}

const lblStyle = { display: "block", fontSize: 11, fontWeight: 700, color: "#6b7a99", letterSpacing: "1.2px", textTransform: "uppercase", marginBottom: 4, fontFamily: "Georgia, serif" };
const chipStyle = (on) => ({ border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "Georgia, serif", background: on ? "#0d1b3e" : "#e8ecf5", color: on ? "#fff" : "#6b7a99" });
const tagStyle = (bg, color) => ({ background: bg, color, borderRadius: 4, padding: "2px 7px", fontSize: 10, fontWeight: 700, fontFamily: "Georgia, serif" });

// ═══════════════════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════════════════
export default function App() {
  const [user, setUser] = useState(() => {
    // Restore session
    const sess = sessionStorage.getItem("fcps-session");
    if (sess) { const acc = getAccs().find(a => a.email === sess); if (acc) return acc; }
    const prin = localStorage.getItem("fcps-principal-session");
    if (prin) { const acc = getAccs().find(a => a.email === prin && a.role === "principal"); if (acc) return acc; }
    const sh = localStorage.getItem("fcps-sh-session");
    if (sh) { try { const { email, pass } = JSON.parse(sh); const acc = getAccs().find(a => a.email === email && a.role === "sectionhead"); if (acc) return acc; } catch {} }
    return null;
  });

  const login = (acc) => {
    if (acc.role === "principal") localStorage.setItem("fcps-principal-session", acc.email);
    else if (acc.role === "sectionhead") localStorage.setItem("fcps-sh-session", JSON.stringify({ email: acc.email, pass: acc.password }));
    else sessionStorage.setItem("fcps-session", acc.email);
    setUser(acc);
  };

  const logout = () => {
    if (!window.confirm("Sign out?")) return;
    sessionStorage.removeItem("fcps-session");
    localStorage.removeItem("fcps-principal-session");
    localStorage.removeItem("fcps-sh-session");
    setUser(null);
  };

  if (!user) return <AuthScreen onLogin={login} />;

  if (user.role === "principal") return <PrincipalApp user={user} onLogout={logout} />;
  if (user.role === "sectionhead") return <SectionHeadApp user={user} onLogout={logout} />;
  return <TeacherApp user={user} onLogout={logout} />;
}

// ═══════════════════════════════════════════════════════════════
// vite.config.js — PASTE INTO YOUR PROJECT ROOT
// ═══════════════════════════════════════════════════════════════
/*
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'FC Public School Kohlu',
        short_name: 'FC School',
        description: 'School Management System',
        theme_color: '#0d1b3e',
        background_color: '#0d1b3e',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ]
})
*/

// ═══════════════════════════════════════════════════════════════
// DEPLOY IN 5 MINUTES (FREE):
// 1. Push to GitHub
// 2. Go to vercel.com → Import project → Deploy
// 3. Your live URL: https://fcschool.vercel.app
// 4. On Android: Chrome → ⋮ Menu → "Add to Home Screen" = APK!
// ═══════════════════════════════════════════════════════════════

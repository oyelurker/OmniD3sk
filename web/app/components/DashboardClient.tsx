"use client";

import { useEffect, useState, useCallback } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface User {
  user_id: string;
  email: string;
  name: string;
  picture: string;
  integrations: {
    notion: { connected: boolean; api_key_hint: string | null; page_id: string | null };
    google_calendar: { connected: boolean; calendar_id: string | null };
  };
}

interface Toast {
  id: number;
  type: "success" | "error" | "info";
  message: string;
}

// ── API base — empty string uses Next.js rewrite proxy (/api/* → backend) ──
const API = "";

// ── Tiny fetch wrapper ────────────────────────────────────────────────────────
async function apiFetch(path: string, opts: RequestInit = {}, token?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { ...opts, headers: { ...headers, ...(opts.headers as Record<string, string> || {}) } });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || res.statusText);
  return res.json();
}

// ── Spinner ───────────────────────────────────────────────────────────────────
function Spinner({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="omni-spin" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="31.4" strokeDashoffset="10" />
    </svg>
  );
}

// ── StatusBadge ───────────────────────────────────────────────────────────────
function StatusBadge({ connected }: { connected: boolean }) {
  return (
    <span className={`omni-badge ${connected ? "omni-badge--on" : "omni-badge--off"}`}>
      <span className={`omni-badge-dot ${connected ? "omni-badge-dot--on" : ""}`} />
      {connected ? "Connected" : "Not connected"}
    </span>
  );
}

// ── Tooltip ───────────────────────────────────────────────────────────────────
function Tooltip({ children, tip }: { children: React.ReactNode; tip: string }) {
  return (
    <span className="omni-tip-wrap" tabIndex={0} aria-label={tip}>
      {children}
      <span className="omni-tip" role="tooltip">{tip}</span>
    </span>
  );
}

// ── Help Drawer ───────────────────────────────────────────────────────────────
function HelpDrawer({
  open, onClose, type,
}: { open: boolean; onClose: () => void; type: "notion" | "gcal" }) {
  const steps = type === "notion" ? [
    {
      n: 1, title: "Create a Notion Integration",
      body: "Go to notion.so/my-integrations → click \"New integration\" → give it a name (e.g. OmniD3sk) → choose your workspace → click \"Submit\".",
    },
    {
      n: 2, title: "Copy your API Key",
      body: "On the integration detail page, under \"Secrets\", copy the Internal Integration Token. It starts with secret_...",
    },
    {
      n: 3, title: "Share a page + get its ID",
      body: "Open the Notion page you want OmniD3sk to write to → \"Share\" → add your integration by name. Then copy the page ID from the URL: notion.so/<workspace>/<PAGE_ID>",
    },
  ] : [
    {
      n: 1, title: "Find your Calendar ID",
      body: "Open Google Calendar → ⚙️ Settings → pick a calendar on the left sidebar → scroll to \"Integrate calendar\" → copy the Calendar ID (looks like abc123@group.calendar.google.com or just \"primary\").",
    },
    {
      n: 2, title: "Create a GCP Service Account",
      body: "In Google Cloud Console → IAM & Admin → Service Accounts → create a new one. Give it the role \"Google Calendar API → Calendar Events Writer\".",
    },
    {
      n: 3, title: "Share the calendar with the service account",
      body: "In Google Calendar, share your chosen calendar with the service account email (e.g. omnid3sk@your-project.iam.gserviceaccount.com) and set permission to \"Make changes to events\".",
    },
  ];

  return (
    <>
      <div className={`omni-overlay ${open ? "omni-overlay--on" : ""}`} onClick={onClose} aria-hidden="true" />
      <aside className={`omni-drawer ${open ? "omni-drawer--open" : ""}`} role="dialog" aria-label="Setup guide" aria-modal="true">
        <div className="omni-drawer-header">
          <h2 className="omni-drawer-title">
            {type === "notion" ? "🗒 Notion Setup Guide" : "📅 Google Calendar Setup Guide"}
          </h2>
          <button className="omni-drawer-close" onClick={onClose} aria-label="Close guide">✕</button>
        </div>
        <div className="omni-drawer-body">
          {steps.map((s) => (
            <div key={s.n} className="omni-step">
              <div className="omni-step-num">{s.n}</div>
              <div>
                <p className="omni-step-title">{s.title}</p>
                <p className="omni-step-body">{s.body}</p>
              </div>
            </div>
          ))}
          <a
            href={type === "notion" ? "https://www.notion.so/my-integrations" : "https://calendar.google.com/calendar/r/settings"}
            target="_blank" rel="noopener noreferrer" className="omni-btn omni-btn--ghost omni-drawer-link"
          >
            Open {type === "notion" ? "Notion" : "Google Calendar"} →
          </a>
        </div>
      </aside>
    </>
  );
}

// ── Toast Container ───────────────────────────────────────────────────────────
function ToastContainer({ toasts, remove }: { toasts: Toast[]; remove: (id: number) => void }) {
  return (
    <div className="omni-toasts" role="region" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`omni-toast omni-toast--${t.type}`}>
          <span>{t.message}</span>
          <button onClick={() => remove(t.id)} aria-label="Dismiss" className="omni-toast-close">✕</button>
        </div>
      ))}
    </div>
  );
}

// ── Input with show/hide for secrets ─────────────────────────────────────────
function SecretInput({ id, label, value, onChange, placeholder, helperText }: {
  id: string; label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; helperText?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="omni-field">
      <label className="omni-label" htmlFor={id}>{label}</label>
      <div className="omni-input-wrap">
        <input
          id={id} type={show ? "text" : "password"} value={value}
          onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className="omni-input" autoComplete="off" spellCheck={false}
        />
        <button type="button" onClick={() => setShow(!show)} className="omni-input-eye" aria-label={show ? "Hide" : "Show"}>
          {show ? "🙈" : "👁"}
        </button>
      </div>
      {helperText && <p className="omni-helper">{helperText}</p>}
    </div>
  );
}

// ── Integration Card ──────────────────────────────────────────────────────────
function IntegrationCard({
  title, icon, connected, children, onOpenHelp,
}: { title: string; icon: string; connected: boolean; children: React.ReactNode; onOpenHelp: () => void }) {
  return (
    <section className="omni-card" aria-label={`${title} integration`}>
      <div className="omni-card-header">
        <div className="omni-card-title-row">
          <span className="omni-card-icon">{icon}</span>
          <h2 className="omni-card-title">{title}</h2>
        </div>
        <div className="omni-card-header-right">
          <StatusBadge connected={connected} />
          <Tooltip tip="How to get these credentials">
            <button className="omni-help-btn" onClick={onOpenHelp} aria-label={`How to set up ${title}`}>?</button>
          </Tooltip>
        </div>
      </div>
      <div className="omni-card-body">{children}</div>
    </section>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function DashboardClient() {
  const [token, setToken]     = useState<string | null>(null);
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts]   = useState<Toast[]>([]);
  const [drawer, setDrawer]   = useState<"notion" | "gcal" | null>(null);

  // Notion form
  const [notionKey, setNotionKey]   = useState("");
  const [notionPage, setNotionPage] = useState("");
  const [savingNotion, setSavingNotion]   = useState(false);
  const [testingNotion, setTestingNotion] = useState(false);

  // Calendar form
  const [calId, setCalId]     = useState("");
  const [saJson, setSaJson]   = useState("");
  const [savingCal, setSavingCal]   = useState(false);
  const [testingCal, setTestingCal] = useState(false);

  const addToast = useCallback((type: Toast["type"], message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ── Extract token from URL on mount ──────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (t) {
      localStorage.setItem("omni_token", t);
      window.history.replaceState({}, "", "/dashboard");
    }
    const stored = t || localStorage.getItem("omni_token");
    if (!stored) { setLoading(false); return; }
    setToken(stored);
  }, []);

  // ── Fetch user profile ────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    apiFetch("/api/auth/me", {}, token)
      .then((u: User) => {
        setUser(u);
        // Pre-fill non-secret fields
        if (u.integrations.notion.page_id) setNotionPage(u.integrations.notion.page_id);
        if (u.integrations.google_calendar.calendar_id) setCalId(u.integrations.google_calendar.calendar_id);
      })
      .catch(() => {
        localStorage.removeItem("omni_token");
        setToken(null);
        addToast("error", "Session expired. Please sign in again.");
      })
      .finally(() => setLoading(false));
  }, [token, addToast]);

  const handleSignIn = () => { window.location.href = "/api/auth/google/login"; };

  const handleSignOut = () => {
    localStorage.removeItem("omni_token");
    setToken(null);
    setUser(null);
    addToast("info", "Signed out successfully.");
  };

  // ── Save Notion ───────────────────────────────────────────────────────────
  const saveNotion = async () => {
    if (!notionKey || !notionPage) { addToast("error", "Both API Key and Page ID are required."); return; }
    setSavingNotion(true);
    try {
      await apiFetch("/api/integrations/notion", { method: "POST", body: JSON.stringify({ api_key: notionKey, page_id: notionPage }) }, token!);
      addToast("success", "Notion credentials saved!");
      const u = await apiFetch("/api/auth/me", {}, token!);
      setUser(u);
    } catch (e: unknown) {
      addToast("error", `Save failed: ${(e as Error).message}`);
    } finally { setSavingNotion(false); }
  };

  // ── Test Notion ───────────────────────────────────────────────────────────
  const testNotion = async () => {
    setTestingNotion(true);
    try {
      const r = await apiFetch("/api/integrations/notion/test", { method: "POST" }, token!);
      addToast(r.success ? "success" : "error", r.message);
    } catch (e: unknown) {
      addToast("error", `Test error: ${(e as Error).message}`);
    } finally { setTestingNotion(false); }
  };

  // ── Save Calendar ─────────────────────────────────────────────────────────
  const saveCalendar = async () => {
    if (!calId) { addToast("error", "Calendar ID is required."); return; }
    setSavingCal(true);
    try {
      await apiFetch("/api/integrations/google_calendar", { method: "POST", body: JSON.stringify({ calendar_id: calId, service_account_json: saJson }) }, token!);
      addToast("success", "Calendar credentials saved!");
      const u = await apiFetch("/api/auth/me", {}, token!);
      setUser(u);
    } catch (e: unknown) {
      addToast("error", `Save failed: ${(e as Error).message}`);
    } finally { setSavingCal(false); }
  };

  // ── Test Calendar ─────────────────────────────────────────────────────────
  const testCalendar = async () => {
    setTestingCal(true);
    try {
      const r = await apiFetch("/api/integrations/calendar/test", { method: "POST" }, token!);
      addToast(r.success ? "success" : "error", r.message);
    } catch (e: unknown) {
      addToast("error", `Test error: ${(e as Error).message}`);
    } finally { setTestingCal(false); }
  };

  // ── Render: Loading ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="omni-loading">
        <Spinner size={40} />
        <p>Loading OmniD3sk…</p>
      </div>
    );
  }

  // ── Render: Sign-In ───────────────────────────────────────────────────────
  if (!token || !user) {
    return (
      <div className="omni-signin-page">
        <div className="omni-signin-card">
          <div className="omni-logo-row">
            <span className="omni-logo-icon">⬡</span>
            <span className="omni-logo-text">OmniD3sk</span>
          </div>
          <h1 className="omni-signin-title">Welcome back</h1>
          <p className="omni-signin-sub">Sign in to manage your integrations</p>
          <button id="google-signin-btn" className="omni-google-btn" onClick={handleSignIn}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        </div>
      </div>
    );
  }

  // ── Render: Dashboard ─────────────────────────────────────────────────────
  const notionConnected = user.integrations.notion.connected;
  const calConnected    = user.integrations.google_calendar.connected;

  return (
    <>
      <div className="omni-root">
        {/* ── Sidebar ── */}
        <nav className="omni-sidebar" aria-label="Main navigation">
          <div className="omni-sidebar-top">
            <div className="omni-logo-row omni-sidebar-logo">
              <span className="omni-logo-icon">⬡</span>
              <span className="omni-logo-text">OmniD3sk</span>
            </div>
            <ul className="omni-nav">
              <li><a href="#integrations" className="omni-nav-link omni-nav-link--active">⬡ Integrations</a></li>
              <li><a href="/" className="omni-nav-link">🎙 Voice Assistant</a></li>
            </ul>
          </div>
          {/* User profile */}
          <div className="omni-sidebar-user">
            {user.picture && <img src={user.picture} alt={user.name} className="omni-avatar" width={36} height={36} />}
            <div className="omni-sidebar-user-info">
              <p className="omni-sidebar-user-name">{user.name}</p>
              <p className="omni-sidebar-user-email">{user.email}</p>
            </div>
            <button className="omni-signout-btn" onClick={handleSignOut} aria-label="Sign out">↪</button>
          </div>
        </nav>

        {/* ── Main ── */}
        <main className="omni-main" id="integrations">
          {/* Header */}
          <header className="omni-page-header">
            <div>
              <h1 className="omni-page-title">Integrations</h1>
              <p className="omni-page-sub">Connect your tools so OmniD3sk can act on your behalf.</p>
            </div>
            <div className="omni-status-pills">
              <span className="omni-status-pill">
                {notionConnected && calConnected ? "✅ All systems connected" : `${[notionConnected, calConnected].filter(Boolean).length}/2 connected`}
              </span>
            </div>
          </header>

          {/* Integration cards */}
          <div className="omni-cards-grid">

            {/* ── Notion ── */}
            <IntegrationCard
              title="Notion" icon="🗒" connected={notionConnected}
              onOpenHelp={() => setDrawer("notion")}
            >
              <div className="omni-fields">
                <SecretInput
                  id="notion-api-key" label="API Key *"
                  value={notionKey} onChange={setNotionKey}
                  placeholder={user.integrations.notion.api_key_hint ?? "secret_xxxxxxxxxxxx"}
                  helperText="Your Notion Internal Integration Token."
                />
                <div className="omni-field">
                  <label className="omni-label" htmlFor="notion-page-id">Page ID *</label>
                  <input
                    id="notion-page-id" type="text" value={notionPage}
                    onChange={(e) => setNotionPage(e.target.value)}
                    placeholder="1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d"
                    className="omni-input"
                  />
                  <p className="omni-helper">32-char hex ID from the Notion page URL.</p>
                </div>
              </div>
              <div className="omni-card-actions">
                <button id="save-notion-btn" className="omni-btn omni-btn--primary" onClick={saveNotion} disabled={savingNotion}>
                  {savingNotion ? <Spinner /> : null} Save
                </button>
                <button id="test-notion-btn" className="omni-btn omni-btn--ghost" onClick={testNotion} disabled={testingNotion || !notionConnected}>
                  {testingNotion ? <Spinner /> : null} Test Connection
                </button>
              </div>
            </IntegrationCard>

            {/* ── Google Calendar ── */}
            <IntegrationCard
              title="Google Calendar" icon="📅" connected={calConnected}
              onOpenHelp={() => setDrawer("gcal")}
            >
              <div className="omni-fields">
                <div className="omni-field">
                  <label className="omni-label" htmlFor="cal-id">Calendar ID *</label>
                  <input
                    id="cal-id" type="text" value={calId}
                    onChange={(e) => setCalId(e.target.value)}
                    placeholder="primary  or  abc123@group.calendar.google.com"
                    className="omni-input"
                  />
                  <p className="omni-helper">Use "primary" for your main calendar, or paste a specific calendar ID.</p>
                </div>
                <SecretInput
                  id="sa-json" label="Service Account JSON (optional)"
                  value={saJson} onChange={setSaJson}
                  placeholder='{"type":"service_account", ...}'
                  helperText="Paste the full JSON key. Leave blank to use the server-wide key."
                />
              </div>
              <div className="omni-card-actions">
                <button id="save-cal-btn" className="omni-btn omni-btn--primary" onClick={saveCalendar} disabled={savingCal}>
                  {savingCal ? <Spinner /> : null} Save
                </button>
                <button id="test-cal-btn" className="omni-btn omni-btn--ghost" onClick={testCalendar} disabled={testingCal || !calConnected}>
                  {testingCal ? <Spinner /> : null} Test Connection
                </button>
              </div>
            </IntegrationCard>

          </div>

          {/* Onboarding banner when nothing is connected */}
          {!notionConnected && !calConnected && (
            <div className="omni-onboard-banner" role="note">
              <p className="omni-onboard-title">🚀 Get started in 3 steps</p>
              <ol className="omni-onboard-steps">
                <li>Click the <strong>?</strong> button on a card for a setup guide.</li>
                <li>Paste your credentials and click <strong>Save</strong>.</li>
                <li>Hit <strong>Test Connection</strong> to confirm everything works.</li>
              </ol>
            </div>
          )}
        </main>
      </div>

      {/* Drawers */}
      <HelpDrawer open={drawer === "notion"} onClose={() => setDrawer(null)} type="notion" />
      <HelpDrawer open={drawer === "gcal"}   onClose={() => setDrawer(null)} type="gcal" />

      {/* Toasts */}
      <ToastContainer toasts={toasts} remove={removeToast} />
    </>
  );
}

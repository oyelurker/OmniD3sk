# 🛡️ OmniD3sk

**Voice-driven AI command center for SecOps & IT Service Management**

> *Built for the Gen AI APAC Edition — Cohort 1 Hackathon*
<img width="1856" height="886" alt="image" src="https://github.com/user-attachments/assets/1ae4ddde-1a04-4cea-9b24-b6bf267d1f54" />

---

## What is OmniD3sk?

OmniD3sk is a **real-time, voice-first AI support platform** combining an IT helpdesk agent with a cybersecurity shield. You speak — the AI listens, triages, executes tools, and responds, all in one continuous audio stream with no mode switching.

The AI persona, **Olivia**, is a battle-hardened IT support specialist who triages issues using P1/P2/P3 SLA severity, speaks 20 human languages, and can book calendar events, create support tickets, and detect phishing attempts — all while you're still talking.

---

## Architecture

```
Browser (AudioWorklet @ 16kHz)
    │  WebSocket — binary PCM + JSON
    ▼
FastAPI Backend
    ├── /ws          → GeminiLive session bridge
    ├── /api/tickets → SQLite ITSM REST
    └── /api/shield  → OmniShield scan
         │  google-genai SDK (Vertex AI)
         ▼
    Gemini Live API  ──  gemini-live-2.5-flash-native-audio
         │  function_calls (mid-conversation)
         ▼
    18 Tool Functions
    ├── SQLite ITSM ticketing
    ├── Google Calendar API v3
    ├── Notion REST API
    ├── Google Web Risk API
    └── Gemini Vision threat analysis
```

### Multi-Agent Graph (ADK Mode)

```
OmniAgent  (root — IT Helpdesk)
├── Researcher       → Google Search grounding for portal/outage lookups
└── OmniShield       (Cybersecurity sub-agent)
    └── ThreatIntel  → Domain scam & phishing cross-referencing
```

---

## Key Features

### 🎙️ Native Duplex Audio
No TTS conversion. `gemini-live-2.5-flash-native-audio` processes and generates audio natively inside the model. Browser AudioWorklets stream raw 16kHz PCM over WebSockets — sub-200ms latency, real-time interruption support.

### 🎫 Live Tool Execution
Olivia calls tools **mid-conversation** without dropping into text mode. A ticket gets created in SQLite, a calendar event appears in Google Calendar, or a Notion report is written — all while the audio stream continues uninterrupted.

### 🛡️ OmniShield — 5-Layer Threat Detection

| Layer | Method | Checks |
|---|---|---|
| 0 | OSINT Heuristics | TLD reputation, typosquatting, subdomain depth |
| 1 | Google Web Risk API | Malware, social engineering, unwanted software |
| 2 | Gemini Vision | Brand impersonation, fake login forms, dark patterns |
| 3 | Search Grounding | Cross-references scam databases and user reports |
| 4 | Claim Verification | Fact-checks third-party brand claims vs. Reuters/BBC/AP |

### 🌐 20-Language Support
English, Hindi, Arabic, Tamil, Telugu, Japanese, Chinese, Korean, German, French, Spanish, Portuguese, Italian, Dutch, Polish, Turkish, Thai, Vietnamese, Indonesian, Malay — language selected at session creation; tickets and tool calls always remain in English.

---

## Tool Registry (18 Functions)

**IT Helpdesk (10):** `search_knowledge_base` · `create_itsm_ticket` · `update_itsm_ticket` · `lookup_error_code` · `lookup_portal_page` · `create_issue` · `diagnose_issue` · `research_support_topic` · `navigate_user_browser` · `book_calendar_slot`

**OmniShield (7):** `scan_url_safety` · `check_domain_reputation` · `analyze_page_for_threats` · `verify_domain_legitimacy` · `detect_fake_content` · `report_threat` · `highlight_danger_zones`

**MCP Integration (1):** `save_threat_report_to_notion`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Voice AI | Gemini Live 2.5 Flash Native Audio (Vertex AI) |
| Backend | FastAPI 0.116 + Uvicorn |
| Frontend | Next.js 15 shell + Vite vanilla JS voice UI |
| Audio | Web AudioWorklets (16kHz PCM capture), AudioContext playback (24kHz) |
| Multi-agent | Google ADK ≥ 1.0.0 |
| Database | SQLite 3 (embedded, zero-config) |
| Integrations | Google Calendar API v3, Notion REST API, Google Web Risk API |
| Deployment | Docker → Google Cloud Run (scale-to-zero) |

---

## Getting Started

### Prerequisites
- Python 3.11+, Node.js 18+
- GCP project with Vertex AI and Calendar API enabled
- Service account key (`gcp-key.json`)

### Local Development

```bash
# 1. Clone and install Python deps
pip install -r requirements.txt

# 2. Build the frontend
cd web && npm install && npm run build

# 3. Configure environment
cp .env.example .env
# Fill in PROJECT_ID, NOTION_API_KEY, CALENDAR_ID, etc.

# 4. Run
uvicorn server.main:app --reload --port 8080
```

### Docker

```bash
docker build -t omnid3sk .
docker run -p 8080:8080 --env-file .env omnid3sk
```

### Deploy to Cloud Run

```bash
gcloud run deploy omnid3sk \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars PROJECT_ID=your-project
```

---

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `PROJECT_ID` | ✅ | GCP project for Vertex AI |
| `LOCATION` | — | Vertex AI region (default: `us-central1`) |
| `GCP_KEY_JSON` | ✅ | Service account key JSON string |
| `CALENDAR_ID` | ✅ | Google Calendar ID for event booking |
| `NOTION_API_KEY` | ✅ | Notion integration token |
| `NOTION_PAGE_ID` | ✅ | Target Notion page (32-char ID) |
| `ENABLE_ADK` | — | `true` to activate multi-agent ADK mode |
| `SESSION_TIME_LIMIT` | — | WebSocket timeout in seconds (default: `300`) |

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Service health check |
| `POST` | `/api/auth` | Issue session token |
| `WS` | `/ws?token=xxx` | Real-time voice + tool event stream |
| `GET` | `/api/tickets` | All ITSM tickets |
| `POST` | `/api/shield` | OmniShield URL/page scan |
| `GET` | `/api/session/{token}/rca` | Download Root Cause Analysis |
| `GET` | `/api/session/{token}/transcript` | Download conversation transcript |
| `POST` | `/api/adk/chat` | Text chat via ADK agents |

---

## The Olivia Persona

Olivia is configured with strict behavioral rules baked into the system prompt:

- **SLA-obsessed** — every issue gets a P1/P2/P3 severity before diagnosis
- **Tool-aggressive** — calls tools the instant enough data is available; never stalls with "let me check"
- **Terse** — 1–2 sentences per turn maximum; stops speaking and waits
- **One ticket per session** — never creates duplicates regardless of how many issues are reported
- **Multilingual** — responds in the user's language while keeping all backend data in English

---

## What Makes This Different

1. **Native audio, not TTS** — intonation, pacing, and interruption handling happen inside the model
2. **Tools fire mid-sentence** — no mode switching; the audio stream never pauses for tool execution
3. **Real integrations** — Calendar events and Notion reports are actually created during a demo
4. **Layered security** — OmniShield chains 5 independent signals before issuing a threat verdict
5. **Proper agent hierarchy** — a 4-agent ADK graph, not a flat tool list with a clever prompt

---

*OmniD3sk — Gen AI APAC Edition Hackathon · Powered by Gemini Live on Vertex AI*
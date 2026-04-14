import './diagnostic-tracker.js';

class ViewSummary extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.sessionData = null;
        this.token = null;
    }

    connectedCallback() {
        this.token = this.getAttribute('token');
        this.renderLoading();
        if (this.token) {
            this.fetchSummary();
        } else {
            this.renderError('No session token provided');
        }
    }

    async fetchSummary() {
        try {
            const res = await fetch(`/api/session/${this.token}/summary`);
            if (!res.ok) throw new Error(`Session not found (${res.status})`);
            this.sessionData = await res.json();
            this.renderSummary();
        } catch (err) {
            this.renderError(err.message);
        }
    }

    renderLoading() {
        this.shadowRoot.innerHTML = `
            ${this.getStyles()}
            <div class="summary-container">
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Loading session summary...</p>
                </div>
            </div>
        `;
    }

    renderError(message) {
        this.shadowRoot.innerHTML = `
            ${this.getStyles()}
            <div class="summary-container">
                <div class="error-state">
                    <h2>Session Summary Unavailable</h2>
                    <p>${message}</p>
                    <button class="action-btn primary" id="home-btn">New Session</button>
                </div>
            </div>
        `;
        this.shadowRoot.querySelector('#home-btn')?.addEventListener('click', () => this.goHome());
    }

    renderSummary() {
        const d = this.sessionData;
        const duration = d.duration_seconds ? `${Math.floor(d.duration_seconds / 60)}m ${d.duration_seconds % 60}s` : 'N/A';
        const startTime = d.start_time ? new Date(d.start_time).toLocaleTimeString() : 'N/A';
        const endTime = d.end_time ? new Date(d.end_time).toLocaleTimeString() : 'In progress';

        this.shadowRoot.innerHTML = `
            ${this.getStyles()}
            <div class="summary-container">
                <div class="summary-header">
                    <div class="sys-tag">SESSION_END // REPORT_GENERATED</div>
                    <h1>OMNID3SK // DIAGNOSTIC_REPORT</h1>
                    <p class="subtitle">OmniD3sk Autonomous SecOps &amp; IT Agent &mdash; Post-Session Analysis</p>
                </div>

                <!-- Metadata -->
                <div class="meta-grid">
                    <div class="meta-item">
                        <span class="meta-label">Duration</span>
                        <span class="meta-value">${duration}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Category</span>
                        <span class="meta-value">${d.module || 'N/A'}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Priority</span>
                        <span class="meta-value priority-${(d.priority || 'medium').toLowerCase()}">${d.priority || 'N/A'}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Language</span>
                        <span class="meta-value">${d.language || 'English'}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Started</span>
                        <span class="meta-value">${startTime}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Ended</span>
                        <span class="meta-value">${endTime}</span>
                    </div>
                </div>

                <!-- Diagnostic Pipeline -->
                <div class="section">
                    <h2 class="section-title">Diagnostic Pipeline</h2>
                    <diagnostic-tracker id="summary-tracker"></diagnostic-tracker>
                </div>

                <!-- Issues -->
                ${d.issues && d.issues.length > 0 ? `
                <div class="section">
                    <h2 class="section-title">Issues Detected (${d.issues.length})</h2>
                    <div class="issues-list">
                        ${d.issues.map(issue => `
                            <div class="issue-card">
                                <span class="severity-badge ${(issue.severity || 'medium').toLowerCase()}">${issue.severity || 'medium'}</span>
                                <span class="issue-title">${issue.title || 'Untitled'}</span>
                                ${issue.portal_page ? `<span class="tcode">Page: ${issue.portal_page}</span>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>` : ''}

                <!-- ITSM Tickets -->
                ${d.tickets && d.tickets.length > 0 ? `
                <div class="section">
                    <h2 class="section-title">ITSM Tickets</h2>
                    ${d.tickets.map(t => `
                        <div class="ticket-card">
                            <div class="ticket-id">${t.ticket_id}</div>
                            <div class="ticket-title">${t.title}</div>
                            <div class="ticket-meta">
                                <span class="severity-badge ${(t.severity || 'medium').toLowerCase()}">${t.severity || 'medium'}</span>
                                <span class="ticket-status">${t.status || 'New'}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>` : ''}

                <!-- Agent Guidance -->
                ${d.agent_guidance && d.agent_guidance.length > 0 ? `
                <div class="section">
                    <h2 class="section-title">Specialist Guidance</h2>
                    <div class="guidance-list">
                        ${d.agent_guidance.map(g => `
                            <div class="guidance-item">
                                <strong>${g.title || ''}</strong>
                                <p>${g.detail || g}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>` : ''}

                <!-- Inline Feedback -->
                <div class="feedback-bento">
                    <div class="feedback-left">
                        <div class="feedback-title">Rate Agent Resolution</div>
                        <div class="feedback-stars" id="summary-stars">
                            <button class="m-csat-star" data-val="1">★</button>
                            <button class="m-csat-star" data-val="2">★</button>
                            <button class="m-csat-star" data-val="3">★</button>
                            <button class="m-csat-star" data-val="4">★</button>
                            <button class="m-csat-star" data-val="5">★</button>
                        </div>
                    </div>
                    <div class="feedback-right">
                        <input type="text" id="summary-feedback-input" placeholder="Add post-mortem notes..." class="feedback-input">
                        <button id="summary-submit-feedback" class="action-btn primary small">Submit</button>
                    </div>
                </div>

                <!-- Actions -->
                <div class="actions">
                    <button class="action-btn primary" id="download-rca">Download Diagnostic Report</button>
                    <button class="action-btn secondary" id="download-transcript">Download Transcript</button>
                    <button class="action-btn outline" id="new-session">New Session</button>
                </div>
            </div>
        `;

        // Set up tracker
        const tracker = this.shadowRoot.querySelector('#summary-tracker');
        if (tracker && d.checkpoints) {
            // Small delay to ensure component is rendered
            setTimeout(() => {
                tracker.updateFromState({ stage: d.stage, checkpoints: d.checkpoints });
            }, 100);
        }

        // Bind actions
        this.shadowRoot.querySelector('#download-rca').addEventListener('click', () => this.downloadFile('rca'));
        this.shadowRoot.querySelector('#download-transcript').addEventListener('click', () => this.downloadFile('transcript'));
        this.shadowRoot.querySelector('#new-session').addEventListener('click', () => this.goHome());

        // Setup Feedback
        const stars = this.shadowRoot.querySelectorAll('.m-csat-star');
        let selectedStar = 0;
        stars.forEach(star => {
            star.addEventListener('click', () => {
                if (this.shadowRoot.querySelector('#summary-submit-feedback').disabled) return;
                selectedStar = parseInt(star.dataset.val);
                stars.forEach(s => s.classList.toggle('active', parseInt(s.dataset.val) <= selectedStar));
            });
        });

        this.shadowRoot.querySelector('#summary-submit-feedback').addEventListener('click', () => {
            if (selectedStar === 0) return; // Optional: Require rating
            const notes = this.shadowRoot.querySelector('#summary-feedback-input').value;
            console.log('CSAT Submitted:', { rating: selectedStar, notes });
            // TODO: POST to API
            
            const btn = this.shadowRoot.querySelector('#summary-submit-feedback');
            btn.textContent = 'Submitted!';
            btn.disabled = true;
            this.shadowRoot.querySelector('#summary-feedback-input').disabled = true;
            stars.forEach(s => s.style.cursor = 'default');
        });
    }

    async downloadFile(type) {
        const btn = this.shadowRoot.querySelector(`#download-${type}`);
        const originalText = btn.textContent;
        btn.textContent = 'Downloading...';
        btn.disabled = true;

        try {
            const res = await fetch(`/api/session/${this.token}/${type}`);
            if (!res.ok) throw new Error('Download failed');
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `omnid3sk-${type}-${this.token.slice(0, 8)}.txt`;
            a.click();
            URL.revokeObjectURL(url);
            btn.textContent = 'Downloaded!';
            setTimeout(() => { btn.textContent = originalText; btn.disabled = false; }, 2000);
        } catch (err) {
            btn.textContent = 'Failed - Retry';
            btn.disabled = false;
        }
    }

    goHome() {
        this.dispatchEvent(new CustomEvent('navigate', {
            bubbles: true,
            composed: true,
            detail: { view: 'home' }
        }));
    }

    getStyles() {
        return `<style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

            :host {
                display: block;
                font-family: 'Inter', system-ui, sans-serif;
                color: var(--color-text-main, #e8eaf0);
                min-height: 100vh;
                background: #050508;
                padding: 48px 24px 100px;
            }

            .summary-container {
                max-width: 860px;
                margin: 0 auto;
            }

            /* ── Header ── */
            .summary-header {
                text-align: center;
                margin-bottom: 40px;
                padding-top: 16px;
            }

            .sys-tag {
                font-size: 0.65rem;
                font-weight: 700;
                letter-spacing: 0.18em;
                text-transform: uppercase;
                color: #0070f3;
                margin-bottom: 14px;
                opacity: 0.8;
            }

            .summary-header h1 {
                font-size: 1.75rem;
                font-weight: 800;
                letter-spacing: 0.04em;
                margin: 0 0 10px;
                color: #ffffff;
                font-family: 'Inter', monospace;
            }

            .subtitle {
                font-size: 0.82rem;
                color: #555;
                margin: 0;
                letter-spacing: 0.02em;
            }

            /* ── Bento Card Base ── */
            .bento-card {
                background: rgba(255,255,255,0.03);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 12px;
            }

            /* ── Meta Grid ── */
            .meta-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 10px;
                margin-bottom: 32px;
            }

            .meta-item {
                background: rgba(255,255,255,0.03);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 12px;
                padding: 14px 16px;
                text-align: center;
                transition: border-color 0.2s;
            }
            .meta-item:hover { border-color: rgba(0,112,243,0.4); }

            .meta-label {
                display: block;
                font-size: 0.62rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                color: #555;
                margin-bottom: 6px;
            }

            .meta-value {
                display: block;
                font-size: 1rem;
                font-weight: 700;
                color: #e8eaf0;
            }

            .priority-critical { color: #ff4444; }
            .priority-high { color: #ff9500; }
            .priority-medium { color: #0070f3; }
            .priority-low { color: #30d158; }

            /* ── Sections ── */
            .section {
                margin-bottom: 20px;
            }

            .section-title {
                font-size: 0.68rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.14em;
                color: #666;
                margin: 0 0 10px;
                padding-bottom: 8px;
                border-bottom: 1px solid rgba(255,255,255,0.06);
            }

            /* ── Issues ── */
            .issues-list {
                display: flex;
                flex-direction: column;
                gap: 6px;
            }

            .issue-card {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 11px 14px;
                background: rgba(255,255,255,0.03);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 10px;
                transition: border-color 0.2s;
            }
            .issue-card:hover { border-color: rgba(0,112,243,0.35); }

            /* ── Severity Badges ── */
            .severity-badge {
                font-size: 0.58rem;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                padding: 3px 8px;
                border-radius: 4px;
                flex-shrink: 0;
            }

            .severity-badge.critical { background: rgba(255,40,40,0.15); color: #ff4444; border: 1px solid rgba(255,40,40,0.3); }
            .severity-badge.high     { background: rgba(255,149,0,0.12); color: #ff9500; border: 1px solid rgba(255,149,0,0.25); }
            .severity-badge.medium   { background: rgba(0,112,243,0.12); color: #0070f3; border: 1px solid rgba(0,112,243,0.25); }
            .severity-badge.low      { background: rgba(48,209,88,0.12); color: #30d158; border: 1px solid rgba(48,209,88,0.25); }

            .issue-title {
                font-weight: 600;
                font-size: 0.88rem;
                flex: 1;
                color: #d0d4e0;
            }

            .tcode {
                font-family: 'SF Mono', 'Fira Code', monospace;
                font-size: 0.72rem;
                color: #0070f3;
                flex-shrink: 0;
                background: rgba(0,112,243,0.08);
                padding: 2px 6px;
                border-radius: 4px;
            }

            /* ── ITSM Tickets ── */
            .ticket-card {
                padding: 16px;
                background: rgba(255,255,255,0.03);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 12px;
                margin-bottom: 8px;
                transition: border-color 0.2s;
            }
            .ticket-card:hover { border-color: rgba(0,112,243,0.35); }

            .ticket-id {
                font-family: 'SF Mono', 'Fira Code', monospace;
                font-size: 0.75rem;
                color: #0070f3;
                margin-bottom: 5px;
                letter-spacing: 0.04em;
            }

            .ticket-title {
                font-weight: 700;
                font-size: 0.95rem;
                margin-bottom: 10px;
                color: #e8eaf0;
            }

            .ticket-meta {
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .ticket-status {
                font-size: 0.75rem;
                color: #555;
                letter-spacing: 0.04em;
                text-transform: uppercase;
            }

            /* ── Guidance ── */
            .guidance-list {
                display: flex;
                flex-direction: column;
                gap: 6px;
            }

            .guidance-item {
                padding: 14px 16px;
                background: rgba(255,255,255,0.03);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 10px;
                font-size: 0.85rem;
                line-height: 1.6;
                transition: border-color 0.2s;
            }
            .guidance-item:hover { border-color: rgba(0,112,243,0.3); }

            .guidance-item strong {
                display: block;
                margin-bottom: 5px;
                color: #0070f3;
                font-size: 0.8rem;
                text-transform: uppercase;
                letter-spacing: 0.06em;
            }

            .guidance-item p {
                margin: 0;
                color: #999;
            }

            /* ── Feedback Bento ── */
            .feedback-bento {
                background: rgba(255, 255, 255, 0.03);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                padding: 20px 24px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 40px;
                margin-bottom: 20px;
            }

            .feedback-left {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .feedback-title {
                font-size: 0.85rem;
                font-weight: 700;
                color: #e8eaf0;
            }

            .feedback-stars {
                display: flex;
                gap: 4px;
            }

            .m-csat-star {
                background: transparent;
                border: none;
                color: rgba(255,255,255,0.15);
                font-size: 1.3rem;
                cursor: pointer;
                padding: 0;
                line-height: 1;
                transition: color 0.2s, transform 0.2s;
            }

            .m-csat-star:hover, .m-csat-star.active {
                color: #0070f3;
                transform: scale(1.1);
            }

            .feedback-right {
                display: flex;
                gap: 12px;
                align-items: center;
            }

            .feedback-input {
                background: rgba(0,0,0,0.3);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 8px;
                padding: 10px 16px;
                color: #e8eaf0;
                font-family: inherit;
                font-size: 0.82rem;
                width: 250px;
                transition: border-color 0.2s;
            }

            .feedback-input:focus {
                outline: none;
                border-color: #0070f3;
            }

            .feedback-input::placeholder {
                color: rgba(255,255,255,0.3);
            }

            .action-btn.small {
                padding: 9px 20px;
                font-size: 0.8rem;
                border-radius: 6px;
            }

            /* ── Actions ── */
            .actions {
                display: flex;
                gap: 10px;
                justify-content: center;
                margin-top: 48px;
                flex-wrap: wrap;
            }

            .action-btn {
                padding: 11px 26px;
                border-radius: 8px;
                font-weight: 600;
                font-size: 0.85rem;
                cursor: pointer;
                transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
                border: 1px solid transparent;
                font-family: inherit;
                letter-spacing: 0.02em;
            }

            .action-btn.primary {
                background: #0070f3;
                color: #fff;
                border-color: #0070f3;
                box-shadow: 0 0 20px rgba(0,112,243,0.3);
            }
            .action-btn.primary:hover {
                background: #0060d8;
                box-shadow: 0 0 30px rgba(0,112,243,0.5);
                transform: translateY(-1px);
            }

            .action-btn.secondary {
                background: rgba(0,112,243,0.08);
                color: #0070f3;
                border-color: rgba(0,112,243,0.4);
            }
            .action-btn.secondary:hover { background: rgba(0,112,243,0.15); }

            .action-btn.outline {
                background: transparent;
                color: #666;
                border-color: rgba(255,255,255,0.12);
            }
            .action-btn.outline:hover { border-color: rgba(255,255,255,0.3); color: #aaa; }

            .action-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none !important; }

            /* ── Loading / Error ── */
            .loading, .error-state {
                text-align: center;
                padding: 80px 20px;
            }

            .spinner {
                width: 36px;
                height: 36px;
                border: 2px solid rgba(255,255,255,0.08);
                border-top-color: #0070f3;
                border-radius: 50%;
                animation: spin 0.8s linear infinite;
                margin: 0 auto 16px;
            }

            @keyframes spin { to { transform: rotate(360deg); } }

            .error-state h2 { margin-bottom: 8px; color: #ff4444; }
            .error-state p { color: #555; margin-bottom: 24px; }

            @media (max-width: 600px) {
                .meta-grid { grid-template-columns: repeat(2, 1fr); }
                .actions { flex-direction: column; align-items: stretch; }
                .summary-header h1 { font-size: 1.3rem; }
                .feedback-bento { flex-direction: column; align-items: stretch; gap: 16px; }
                .feedback-input { width: 100%; }
                .feedback-right { flex-direction: column; }
                .feedback-right button { width: 100%; }
            }
        </style>`;
    }
}

customElements.define('view-summary', ViewSummary);

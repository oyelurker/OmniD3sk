class ViewHome extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <style>
                view-home {
                    display: block;
                    width: 100%;
                    background: #000000 !important;
                    color: #ffffff;
                    /* Core CSS Properties */
                    --bg: #000000;
                    --surface: #141414;
                    --text: #f5f5f5;
                    --muted: #878787;
                    --stroke: #1f1f1f;
                    --accent-grad: linear-gradient(90deg, #89AACC 0%, #4E85BF 100%);
                    
                    font-family: 'General Sans', sans-serif;
                }
                * { box-sizing: border-box; margin: 0; padding: 0; }

                /* Instrument Serif font class */
                .font-display { font-family: 'Instrument Serif', serif; font-style: italic; font-weight: 400; }

                .hero-section {
                    position: relative;
                    width: 100%;
                    min-height: 100vh;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }

                /* ─── Video Background ─── */
                .bg-video {
                    position: absolute;
                    top: 0; left: 0;
                    width: 100%; height: 100%;
                    object-fit: cover;
                    object-position: center top;
                    transform: scale(1.4) translateY(12%);
                    z-index: 1;
                    pointer-events: none;
                }
                .overlay {
                    position: absolute;
                    top: 0; left: 0;
                    width: 100%; height: 100%;
                    background: rgba(0, 0, 0, 0.7);
                    z-index: 2;
                }
                
                /* Bottom fade gradient for hero to blend seamlessly */
                .hero-fade {
                    position: absolute;
                    bottom: -5px; left: 0; width: 100%; height: 40vh;
                    background: linear-gradient(to top, #000000 0%, #000000 10%, rgba(0,0,0,0.8) 30%, transparent 100%);
                    z-index: 3;
                    pointer-events: none;
                }

                /* ─── Navbar ─── */
                .navbar {
                    position: relative; z-index: 10;
                    display: flex; justify-content: space-between; align-items: center;
                    padding: 20px 120px; width: 100%;
                }
                .nav-left { display: flex; align-items: center; gap: 40px; }
                .logo { font-size: 25px; font-weight: 700; letter-spacing: -0.05em; display: flex; align-items: center; gap: 8px; }
                
                .nav-center {
                    position: absolute;
                    left: 50%;
                    transform: translateX(-50%);
                    display: flex;
                    align-items: center;
                }
                .center-logo {
                    height: 36px;
                    object-fit: contain;
                }
                .nav-links { display: flex; gap: 30px; }
                .nav-links a { color: white; font-size: 14px; font-weight: 500; text-decoration: none; display: flex; align-items: center; gap: 14px; transition: opacity 0.2s; }
                .nav-links a:hover { opacity: 0.7; }
                .chevron { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2; opacity: 0.8; }

                /* ─── Web3 Buttons (Layered Pill Component) ─── */
                .waitlist-btn {
                    position: relative;
                    display: inline-flex;
                    border-radius: 9999px;
                    padding: 0.6px;
                    background: rgba(255, 255, 255, 0.3);
                    border: none;
                    cursor: pointer;
                    overflow: hidden;
                    text-decoration: none;
                    transition: transform 0.3s cubic-bezier(0.19, 1, 0.22, 1);
                }
                .waitlist-btn:hover { transform: scale(1.02); }
                .btn-glow {
                    position: absolute; top: -5px; left: 20%; width: 60%; height: 10px;
                    background: rgba(255, 255, 255, 0.9); filter: blur(8px); z-index: 1; opacity: 0.8;
                }
                .btn-inner {
                    position: relative; z-index: 2; border-radius: 9999px; padding: 11px 29px;
                    font-size: 14px; font-weight: 500; display: flex; align-items: center; justify-content: center; gap: 8px;
                    font-family: 'General Sans', sans-serif;
                }
                .nav-btn .btn-inner { background: #000; color: #fff; }
                .white-btn .btn-inner { background: #fff; color: #000; }
                .white-btn .btn-glow { background: rgba(0,0,0,0.5); opacity: 0.3; } 
                .beta-btn { background: rgba(255, 255, 255, 0.15); }
                .beta-btn .btn-inner { background: rgba(0, 0, 0, 0.85); color: #fff; backdrop-filter: blur(12px); }
                .badge-beta { background: rgba(0, 212, 170, 0.15); color: #00d4aa; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; letter-spacing: 0.05em; }

                /* ─── Hero Content ─── */
                .hero-content {
                    position: relative; z-index: 10;
                    display: flex; flex-direction: column; align-items: center; text-align: center;
                    margin-top: auto; margin-bottom: auto;
                    transform: translateY(-8vh); /* Safely bumps text up into vortex without breaking layout */
                    padding: 40px 20px;
                }
                .hero-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 20px; padding: 6px 14px; font-size: 13px; font-weight: 500; backdrop-filter: blur(8px); }
                .badge-dot { width: 4px; height: 4px; background: #fff; border-radius: 50%; }
                .hero-heading { 
                    margin-top: 40px; margin-bottom: 24px; max-width: 800px; font-size: 64px; font-weight: 500; line-height: 1.1; 
                    letter-spacing: -0.02em; 
                    background: linear-gradient(110deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,1) 20%, rgba(255,255,255,1) 80%, rgba(255,255,255,0.5) 100%);
                    background-size: 200% auto;
                    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; 
                }
                .hero-subtitle { max-width: 680px; font-size: 18px; font-weight: 400; color: #EAEAEA; line-height: 1.6; margin-bottom: 40px; }
                .cta-group { display: flex; gap: 16px; align-items: center; justify-content: center; }

                /* Scroll indicator */
                .scroll-indicator {
                    position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%);
                    z-index: 10; display: flex; flex-direction: column; align-items: center;
                    gap: 8px; opacity: 0.5;
                }
                .scroll-indicator span { font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; }
                .scroll-line { width: 1px; height: 40px; background: rgba(255,255,255,0.2); position: relative; overflow: hidden; }
                .scroll-line::after { content:''; position: absolute; top:0; left:0; width:1px; height:20px; background: #fff; animation: scrollDown 2s infinite ease-in-out; }
                @keyframes scrollDown { 0% { transform: translateY(-20px); } 100% { transform: translateY(40px); } }

                /* Common Generic Section */
                .section { padding: 100px 20px; max-width: 1200px; margin: 0 auto; width: 100%; overflow: hidden; }
                .section-header { margin-bottom: 60px; }
                .eyebrow { display: flex; align-items: center; gap: 12px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3em; color: var(--muted); margin-bottom: 20px; }
                .eyebrow::before { content: ''; width: 32px; height: 1px; background: var(--stroke); }
                .section-title { font-size: 48px; line-height: 1.1; letter-spacing: -0.02em; margin-bottom: 20px; color: #ffffff !important; }
                .section-title span.font-display { font-family: 'Instrument Serif', serif; font-style: italic; font-weight: 400; color: rgba(255,255,255,0.85); }
                .section-desc { font-size: 16px; color: var(--muted); max-width: 500px; line-height: 1.6; }

                /* ─── Selected Works Bento Box ─── */
                .bento-grid {
                    display: grid;
                    grid-template-columns: repeat(12, 1fr);
                    gap: 24px;
                }
                .bento-card {
                    position: relative;
                    border-radius: 24px;
                    overflow: hidden;
                    border: 1px solid var(--stroke);
                    background: var(--surface);
                    min-height: 380px;
                    display: flex;
                    align-items: flex-end;
                    padding: 30px;
                    transition: transform 0.4s ease;
                }
                .bento-card:hover { transform: translateY(-4px); border-color: rgba(255,255,255,0.2); }
                .bento-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0.4; transition: opacity 0.4s, transform 0.6s ease; }
                .bento-card:hover .bento-img { opacity: 0.7; transform: scale(1.05); }
                .bento-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.9), transparent 60%); z-index: 1; pointer-events: none; }
                
                .bento-content { position: relative; z-index: 2; width: 100%; display: flex; justify-content: space-between; align-items: flex-end; }
                .bento-title { font-size: 32px; color: #fff; }
                .bento-btn { background: #fff; color: #000; border-radius: 40px; padding: 6px 16px; font-size: 12px; font-weight: 600; opacity: 0; transform: translateY(10px); transition: all 0.3s ease; }
                .bento-card:hover .bento-btn { opacity: 1; transform: translateY(0); }

                .bento-card:nth-child(1) { grid-column: span 7; }
                .bento-card:nth-child(2) { grid-column: span 5; }
                .bento-card:nth-child(3) { grid-column: span 5; }
                .bento-card:nth-child(4) { grid-column: span 7; }

                /* ─── Journal Pills ─── */
                .journal-list { display: flex; flex-direction: column; gap: 16px; }
                .journal-pill {
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 24px 32px;
                    background: rgba(20, 20, 20, 0.5);
                    border: 1px solid var(--stroke);
                    border-radius: 9999px;
                    transition: all 0.3s ease;
                    cursor: pointer;
                }
                .journal-pill:hover { background: var(--surface); border-color: rgba(255,255,255,0.15); transform: translateX(8px); }
                .j-left { display: flex; align-items: center; gap: 24px; }
                .j-img { width: 64px; height: 64px; border-radius: 50%; object-fit: cover; border: 1px solid var(--stroke); }
                .j-title { font-size: 20px; font-weight: 500; }
                .j-meta { font-size: 14px; color: var(--muted); }
                
                /* ─── Stats Section ─── */
                .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px; border-top: 1px solid var(--stroke); padding-top: 60px; }
                .stat-item { display: flex; flex-direction: column; gap: 8px; }
                .stat-num { font-size: 64px; font-weight: 500; font-family: 'Instrument Serif', serif; font-style: italic; background: var(--accent-grad); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;}
                .stat-label { font-size: 14px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.1em; }

                /* ─── Footer Marquee ─── */
                .footer { padding-top: 80px; padding-bottom: 40px; overflow: hidden; position: relative; border-top: 1px solid var(--stroke); }
                .marquee-container { width: 100vw; overflow: hidden; white-space: nowrap; margin-bottom: 60px; margin-left: calc(-50vw + 50%); }
                .marquee-inner { display: inline-block; animation: marquee 30s linear infinite; font-size: 100px; font-weight: 700; color: transparent; -webkit-text-stroke: 1px rgba(255,255,255,0.1); font-family: 'General Sans', sans-serif; }
                .marquee-inner span { padding-right: 40px; }
                @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }

                .footer-bottom { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; font-size: 14px; color: var(--muted); padding: 0 20px; }
                .socials { display: flex; gap: 24px; }
                .socials a { color: var(--text); text-decoration: none; transition: color 0.2s; }
                .socials a:hover { color: #fff; }
                .available { display: flex; align-items: center; gap: 8px; }
                .green-dot { width: 8px; height: 8px; background: #00d4aa; border-radius: 50%; box-shadow: 0 0 8px #00d4aa; }

                @media (max-width: 768px) {
                    .navbar { padding: 20px; }
                    .nav-links { display: none; }
                    .bento-card:nth-child(n) { grid-column: span 12; }
                    .journal-pill { flex-direction: column; border-radius: 24px; text-align: center; gap: 16px; padding: 24px; }
                    .j-left { flex-direction: column; }
                    .stats-grid { grid-template-columns: 1fr; text-align: center; }
                    .footer-bottom { flex-direction: column; gap: 32px; }
                }

                /* Entrance Animations */
                .hero-badge, .hero-heading, .hero-subtitle, .cta-group {
                    animation: fadeInUp 0.8s cubic-bezier(0.19, 1, 0.22, 1) both;
                }
                .hero-heading { 
                    animation: fadeInUp 0.8s cubic-bezier(0.19, 1, 0.22, 1) both, shineSweep 5s linear infinite;
                    animation-delay: 0.1s, 0s; 
                }
                @keyframes shineSweep {
                    0% { background-position: 200% center; }
                    100% { background-position: -200% center; }
                }
                .hero-subtitle { animation-delay: 0.2s; }
                .cta-group { animation-delay: 0.3s; }
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

                /* Scroll Reveal Classes */
                .reveal {
                    opacity: 0;
                    transform: translateY(40px);
                    transition: opacity 0.8s cubic-bezier(0.19, 1, 0.22, 1), transform 0.8s cubic-bezier(0.19, 1, 0.22, 1);
                }
                .reveal.active {
                    opacity: 1;
                    transform: translateY(0);
                }
                .delay-1 { transition-delay: 0.05s; }
                .delay-2 { transition-delay: 0.1s; }
                .delay-3 { transition-delay: 0.15s; }
                .delay-4 { transition-delay: 0.2s; }
            </style>

            <!-- Hero Section -->
            <section class="hero-section">
                <video autoplay loop muted playsinline class="bg-video">
                    <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260217_030345_246c0224-10a4-422c-b324-070b7c0eceda.mp4" type="video/mp4">
                </video>
                <div class="overlay"></div>
                <div class="hero-fade"></div>

                <nav class="navbar">
                    <div class="nav-left">
                        <div class="logo">
                            OmniD3sk
                        </div>
                    </div>
                    
                    <div class="nav-center">
                    </div>

                    <div class="nav-right">
                        <a href="https://github.com/oyelurker/OmniD3sk" target="_blank" class="waitlist-btn nav-btn" style="text-decoration: none;">
                            <div class="btn-inner">GitHub Repo</div>
                        </a>
                    </div>
                </nav>

                <div class="hero-content">
                    <div class="hero-badge">
                        <span class="badge-dot"></span>
                        <span class="badge-text-dim">Autonomous Intelligence</span>
                        <span class="badge-text-bright">v2.0 Beta</span>
                    </div>

                    <h1 class="hero-heading">SecOps at the Speed of Thought</h1>

                    <p class="hero-subtitle">
                        Meet Olivia, your Voice-First AI Agent. OmniD3sk is the autonomous command center for SecOps and IT teams, leveraging real-time voice intelligence to orchestrate workflows, resolve tickets, and heal your infrastructure instantly.
                    </p>

                    <div class="cta-group">
                        <button class="waitlist-btn white-btn" id="start-btn">
                            <div class="btn-glow"></div>
                            <div class="btn-inner">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>
                                Start Voice Session
                                <span class="badge-beta">BETA</span>
                            </div>
                        </button>
                        
                        <button class="waitlist-btn beta-btn">
                            <div class="btn-inner">Join Waitlist</div>
                        </button>
                    </div>
                </div>

                <div class="scroll-indicator">
                    <span>Scroll</span>
                    <div class="scroll-line"></div>
                </div>
            </section>

            <!-- Selected Works Section -->
            <section class="section reveal">
                <div class="section-header">
                    <div class="eyebrow">Platform Capabilities</div>
                    <h2 class="section-title">Core <span class="font-display">infrastructure</span></h2>
                    <p class="section-desc">A selection of autonomous SecOps and IT workflows orchestrated by the OmniD3sk engine.</p>
                </div>

                <div class="bento-grid">
                    <div class="bento-card reveal delay-1">
                        <img src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1000&auto=format&fit=crop" class="bento-img" />
                        <div class="bento-overlay"></div>
                        <div class="bento-content">
                            <div class="bento-title font-display">Threat Intelligence</div>
                            <div class="bento-btn">View Module</div>
                        </div>
                    </div>
                    <div class="bento-card reveal delay-2">
                        <img src="https://images.unsplash.com/photo-1593642532842-98d0fd5ebc1a?q=80&w=1000&auto=format&fit=crop" class="bento-img" />
                        <div class="bento-overlay"></div>
                        <div class="bento-content">
                            <div class="bento-title font-display">
                                Voice Helpdesk (Olivia)
                                <span style="display:block; font-size:15px; font-family:'Inter', sans-serif; font-style:normal; opacity:0.7; margin-top:8px; line-height:1.4;">Powered by Gemini Live. Speak directly to Olivia to diagnose IT issues and auto-generate ITSM tickets without typing a word.</span>
                            </div>
                            <div class="bento-btn">View Module</div>
                        </div>
                    </div>
                    <div class="bento-card reveal delay-1">
                        <img src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=1000&auto=format&fit=crop" class="bento-img" />
                        <div class="bento-overlay"></div>
                        <div class="bento-content">
                            <div class="bento-title font-display">Infrastructure Monitoring</div>
                            <div class="bento-btn">View Module</div>
                        </div>
                    </div>
                    <div class="bento-card reveal delay-2">
                        <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop" class="bento-img" />
                        <div class="bento-overlay"></div>
                        <div class="bento-content">
                            <div class="bento-title font-display">
                                Custom Playbooks
                                <span style="display:block; font-size:15px; font-family:'Inter', sans-serif; font-style:normal; opacity:0.7; margin-top:8px; line-height:1.4;">Connects directly to Notion, Google Calendar, and your enterprise ITSM dashboards for zero-touch resolution.</span>
                            </div>
                            <div class="bento-btn">View Module</div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Journal Section -->
            <section class="section reveal">
                <div class="section-header">
                    <div class="eyebrow">System Logs</div>
                    <h2 class="section-title">Recent <span class="font-display">playbooks</span></h2>
                    <p class="section-desc">Real-time ITSM dashboard syncing and security actions executed by Olivia during active voice sessions.</p>
                </div>

                <div class="journal-list">
                    <div class="journal-pill reveal delay-1">
                        <div class="j-left">
                            <img src="https://images.unsplash.com/photo-1614064641913-6b714041d132?q=80&w=200&auto=format&fit=crop" class="j-img" />
                            <div>
                                <div class="j-title">Network Vulnerability Scan</div>
                                <div class="j-meta">5m avg duration • Security</div>
                            </div>
                        </div>
                        <div class="j-date">Executed April 04, 2026</div>
                    </div>
                    <div class="journal-pill reveal delay-2">
                        <div class="j-left">
                            <img src="https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?q=80&w=200&auto=format&fit=crop" class="j-img" />
                            <div>
                                <div class="j-title font-display">Routine Password Reset Queue</div>
                                <div class="j-meta">2m avg duration • IT Helpdesk</div>
                            </div>
                        </div>
                        <div class="j-date">Executed March 28, 2026</div>
                    </div>
                    <div class="journal-pill reveal delay-3">
                        <div class="j-left">
                            <img src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=200&auto=format&fit=crop" class="j-img" />
                            <div>
                                <div class="j-title">Cloud Instance Provisioning</div>
                                <div class="j-meta">12m avg duration • Infrastructure</div>
                            </div>
                        </div>
                        <div class="j-date">Executed February 15, 2026</div>
                    </div>
                </div>
            </section>

            <!-- Stats Section -->
            <section class="section reveal">
                <div class="stats-grid">
                    <div class="stat-item reveal delay-1">
                        <div class="stat-num">99.9%</div>
                        <div class="stat-label">System Uptime</div>
                    </div>
                    <div class="stat-item reveal delay-2">
                        <div class="stat-num">10k+</div>
                        <div class="stat-label">Tickets Resolved</div>
                    </div>
                    <div class="stat-item reveal delay-3">
                        <div class="stat-num">< 2s</div>
                        <div class="stat-label">Agent Response Time</div>
                    </div>
                </div>
            </section>

            <!-- Footer Area -->
            <footer class="footer reveal">
                <div class="marquee-container">
                    <div class="marquee-inner">
                        <span>SECURE • AUTOMATE • ORCHESTRATE •</span>
                        <span>SECURE • AUTOMATE • ORCHESTRATE •</span>
                        <span>SECURE • AUTOMATE • ORCHESTRATE •</span>
                        <span>SECURE • AUTOMATE • ORCHESTRATE •</span>
                        <span>SECURE • AUTOMATE • ORCHESTRATE •</span>
                        <span>SECURE • AUTOMATE • ORCHESTRATE •</span>
                    </div>
                </div>

                <div class="footer-bottom reveal delay-1">
                    <div class="socials">
                        <a href="#">Documentation</a>
                        <a href="https://github.com/oyelurker/OmniD3sk" target="_blank">GitHub</a>
                        <a href="#">Waitlist</a>
                        <a href="#">Contact Sales</a>
                    </div>
                    <div class="available">
                        <div class="green-dot"></div>
                        System Secure & Online
                    </div>
                </div>
            </footer>
        `;

        // Setting up IntersectionObserver for scroll animations
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.15
        };

        const scrollObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        this.querySelectorAll('.reveal').forEach(el => scrollObserver.observe(el));

        // Start button logic
        this.querySelector('#start-btn').addEventListener('click', () => {
            const language = "English"; 
            const userName = "Guest";   
            
            // Dramatic exit animation
            this.style.opacity = '0';
            this.style.transform = 'scale(1.05)';
            this.style.filter = 'blur(10px) brightness(1.5)';
            this.style.transition = 'all 0.6s cubic-bezier(0.19, 1, 0.22, 1)';

            setTimeout(() => {
                this.dispatchEvent(new CustomEvent('navigate', {
                    bubbles: true,
                    detail: { view: 'session', language, userName }
                }));
            }, 500);
        });
    }
}

customElements.define('view-home', ViewHome);

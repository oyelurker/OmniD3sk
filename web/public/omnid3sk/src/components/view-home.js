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
                /* ─── Auth & Drawer Styles ─── */
                .auth-avatar { width: 24px; height: 24px; border-radius: 50%; object-fit: cover; }
                .auth-dropdown-wrapper { position: relative; display: inline-block; }
                .auth-dropdown-menu {
                    position: absolute; top: 120%; right: 0; background: var(--surface); border: 1px solid var(--stroke);
                    border-radius: 12px; padding: 8px; display: none; flex-direction: column; min-width: 160px; z-index: 100;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.5);
                }
                .auth-dropdown-menu.active { display: flex; animation: fadeInUp 0.2s ease; }
                .auth-menu-item {
                    padding: 10px 16px; color: #fff; text-decoration: none; font-size: 14px;
                    border-radius: 8px; cursor: pointer; transition: background 0.2s; text-align: left; background: transparent; border: none; font-family: inherit;
                }
                .auth-menu-item:hover { background: rgba(255,255,255,0.1); }
                .auth-menu-item.danger { color: #ff4d4d; }

                /* Drawer */
                .drawer-overlay {
                    position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
                    z-index: 999; opacity: 0; pointer-events: none; transition: opacity 0.3s;
                }
                .drawer-overlay.active { opacity: 1; pointer-events: auto; }
                .drawer-panel {
                    position: fixed; right: 0; top: 0; height: 100vh; width: 450px; background: #0a0a0a;
                    border-left: 1px solid #222; z-index: 1000; transform: translateX(100%);
                    transition: transform 0.3s cubic-bezier(0.19, 1, 0.22, 1); display: flex; flex-direction: column;
                }
                @media (max-width: 768px) { .drawer-panel { width: 100%; } }
                .drawer-panel.active { transform: translateX(0); }
                .drawer-header { padding: 24px; border-bottom: 1px solid #222; display: flex; justify-content: space-between; align-items: center; }
                .drawer-title { font-size: 20px; font-weight: 500; }
                .drawer-close { background: none; border: none; color: #888; cursor: pointer; font-size: 28px; transition: color 0.2s; padding:0; line-height:1; }
                .drawer-close:hover { color: #fff; }
                .drawer-content { padding: 24px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 24px; }
                
                /* Drawer Integration Cards */
                .integration-card { background: #141414; border: 1px solid #222; border-radius: 12px; padding: 20px; text-align: left; }
                .integration-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
                .integration-name { font-size: 16px; font-weight: 500; display:flex; align-items:center; gap:8px;}
                .status-badge { font-size: 10px; font-weight: 700; padding: 4px 8px; border-radius: 4px; letter-spacing: 0.05em; display:inline-flex; align-items:center; gap:4px;}
                .status-badge.connected { background: rgba(0,212,170,0.1); color: #00d4aa; }
                .status-badge.disconnected { background: rgba(255,255,255,0.05); color: #888; }
                .integration-form { display: flex; flex-direction: column; gap: 12px; }
                .input-group { display: flex; flex-direction: column; gap: 6px; }
                .input-group label { font-size: 12px; color: #aaa; }
                .input-group input { background: #000; border: 1px solid #333; border-radius: 6px; padding: 10px; color: #fff; font-family: inherit; font-size: 14px; width:100%;}
                .input-group input:focus { outline: none; border-color: #555; }
                .drawer-btn { background: #fff; color: #000; border: none; border-radius: 6px; padding: 10px; font-weight: 600; cursor: pointer; font-family: inherit; font-size: 14px; transition:opacity 0.2s;}
                .drawer-btn:hover { opacity: 0.8; }
                
                /* Setup Guide Styles */
                .setup-guide { margin-bottom: 16px; background: rgba(255,255,255,0.03); border: 1px solid #333; border-radius: 8px; overflow: hidden; }
                .setup-guide summary { padding: 12px 16px; font-size: 13px; font-weight: 500; cursor: pointer; list-style: none; display: flex; align-items: center; justify-content: space-between; color: #ccc; }
                .setup-guide summary::-webkit-details-marker { display: none; }
                .setup-guide summary:hover { background: rgba(255,255,255,0.05); color: #fff; }
                .setup-guide summary::after { content: '+'; font-size: 16px; }
                .setup-guide[open] summary::after { content: '-'; }
                .setup-guide-content { padding: 0 16px 16px 16px; font-size: 12px; color: #aaa; line-height: 1.5; }
                .setup-guide-content ol { padding-left: 16px; margin-top: 8px; display:flex; flex-direction:column; gap:6px; }
                .setup-guide-content a { color: #89AACC; text-decoration: none; }
                .setup-guide-content a:hover { text-decoration: underline; }

                /* ─── Warning Modal ─── */
                .modal-overlay {
                    position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px);
                    z-index: 2000; display: none; align-items: center; justify-content: center;
                }
                .modal-overlay.active { display: flex; }
                .modal-box {
                    background: #111; border: 1px solid #333; border-radius: 16px; padding: 32px;
                    max-width: 420px; width: 90%; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.8);
                }
                .modal-title { font-size: 28px; font-weight: 500; margin-bottom: 12px; font-family: 'Instrument Serif', serif; font-style: italic; color: #fff; }
                .modal-desc { font-size: 14px; color: #ccc; margin-bottom: 32px; line-height: 1.5; }
                .modal-actions { display: flex; flex-direction: column; gap: 12px; }
                .modal-btn { padding: 14px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; border: none; font-family: inherit; transition: all 0.2s; }
                .modal-btn:hover { transform: scale(1.02); }
                .btn-primary { background: #fff; color: #000; }
                .btn-danger { background: rgba(255, 77, 77, 0.15); color: #ff4d4d; border: 1px solid rgba(255, 77, 77, 0.3); }
                .btn-danger:hover { background: rgba(255, 77, 77, 0.25); }
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

                    <div class="nav-right" id="nav-auth-container">
                        <!-- Auth buttons injected via JS -->
                        <div style="width: 120px; height: 40px;"></div>
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

            <!-- Warning Modal -->
            <div class="modal-overlay" id="setup-warning-modal">
                <div class="modal-box">
                    <div class="modal-title">Setup Incomplete</div>
                    <div class="modal-desc">You haven't fully connected your integrations (Notion / Google Calendar). Olivia's autonomous actions will be heavily limited.</div>
                    <div class="modal-actions">
                        <button class="modal-btn btn-primary" id="modal-setup-btn">Take me to Setup</button>
                        <button class="modal-btn btn-danger" id="modal-continue-btn">Continue with Default</button>
                    </div>
                </div>
            </div>

            <!-- Integrations Drawer -->
            <div class="drawer-overlay" id="integrations-overlay"></div>
            <div class="drawer-panel" id="integrations-drawer">
                <div class="drawer-header">
                    <div class="drawer-title">Integrations</div>
                    <button class="drawer-close" id="close-drawer">&times;</button>
                </div>
                <div class="drawer-content">
                    <p style="color:var(--muted); font-size:14px; margin-bottom:8px;">Connect your tools so OmniD3sk can act on your behalf.</p>
                    <div id="drawer-integrations-container">
                        <!-- Rendered by JS -->
                    </div>
                </div>
            </div>
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

        // Auth / Token logic
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        if (token) {
            localStorage.setItem('omnid3sk_token', token);
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        this.initAuth();

        // Drawer Event Listeners
        this.querySelector('#integrations-overlay').addEventListener('click', () => this.closeDrawer());
        this.querySelector('#close-drawer').addEventListener('click', () => this.closeDrawer());

        // Start button logic
        this.querySelector('#start-btn').addEventListener('click', () => {
            const notionConnected = this.user?.integrations?.notion?.connected;
            const gcalConnected = this.user?.integrations?.google_calendar?.connected;

            if (!notionConnected || !gcalConnected) {
                this.querySelector('#setup-warning-modal').classList.add('active');
                return;
            }

            this.startSession();
        });

        // Modal actions
        this.querySelector('#modal-setup-btn').addEventListener('click', () => {
            this.querySelector('#setup-warning-modal').classList.remove('active');
            if (!this.user) {
                window.location.href = "/api/auth/google/login";
            } else {
                this.openDrawer();
            }
        });

        this.querySelector('#modal-continue-btn').addEventListener('click', () => {
            this.querySelector('#setup-warning-modal').classList.remove('active');
            this.startSession();
        });
    }

    startSession() {
        const language = "English"; 
        const userName = this.user ? this.user.name : "Guest";   
        
        // Dramatic exit animation
        this.style.opacity = '0';
        this.style.transform = 'scale(1.05)';
        this.style.filter = 'blur(10px) brightness(1.5)';
        this.style.transition = 'all 0.6s cubic-bezier(0.19, 1, 0.22, 1)';

        setTimeout(() => {
            const root = document.querySelector('app-root');
            if (root && root.state && root.render) {
                // Bypass event bubbling and force the state change and render
                root.state.view = 'session';
                root.state.language = language;
                root.state.token = localStorage.getItem('omnid3sk_token');
                root.render();
            } else {
                // Fallback
                this.dispatchEvent(new CustomEvent('navigate', {
                    bubbles: true,
                    composed: true,
                    detail: { view: 'session', language, userName, token: localStorage.getItem('omnid3sk_token') }
                }));
            }
        }, 500);
    }

    async initAuth() {
        const container = this.querySelector('#nav-auth-container');
        const token = localStorage.getItem('omnid3sk_token');
        
        if (!token) {
            this.renderLoginButton(container);
            return;
        }

        try {
            // Next.js proxies this to 8080
            const res = await fetch('/api/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Not authenticated');
            
            this.user = await res.json();
            this.renderUserMenu(container);
        } catch (err) {
            console.error("Auth error:", err);
            localStorage.removeItem('omnid3sk_token');
            this.renderLoginButton(container);
        }
    }

    renderLoginButton(container) {
        container.innerHTML = `
            <a href="/api/auth/google/login" class="waitlist-btn nav-btn" style="text-decoration: none;">
                <div class="btn-inner">Sign In</div>
            </a>
        `;
    }

    renderUserMenu(container) {
        const initial = this.user.name ? this.user.name.charAt(0).toUpperCase() : '?';
        const pictureHtml = this.user.picture 
            ? `<img src="${this.user.picture}" class="auth-avatar" />`
            : `<div class="auth-avatar" style="background:#333; display:flex; align-items:center; justify-content:center; font-size:12px;">${initial}</div>`;

        container.innerHTML = `
            <div class="auth-dropdown-wrapper" id="auth-dropdown">
                <button class="waitlist-btn nav-btn" style="border:none; cursor:pointer;" id="user-menu-btn">
                    <div class="btn-inner" style="gap:10px;">
                        ${pictureHtml}
                        <span>${this.user.name}</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                </button>
                <div class="auth-dropdown-menu" id="auth-menu-content">
                    <button class="auth-menu-item" id="menu-integrations">Integrations</button>
                    <button class="auth-menu-item danger" id="menu-logout">Sign Out</button>
                </div>
            </div>
        `;

        // Dropdown toggle
        const btn = this.querySelector('#user-menu-btn');
        const menu = this.querySelector('#auth-menu-content');
        
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            menu.classList.toggle('active');
        });

        document.addEventListener('click', () => {
            if (menu.classList.contains('active')) menu.classList.remove('active');
        });

        // Menu Actions
        this.querySelector('#menu-integrations').addEventListener('click', () => {
            this.openDrawer();
        });

        this.querySelector('#menu-logout').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Sign Out clicked. Removing token.");
            localStorage.removeItem('omnid3sk_token');
            // Force a full navigation to root to guarantee state is cleared
            window.location.href = '/';
        });
    }

    openDrawer() {
        this.querySelector('#integrations-overlay').classList.add('active');
        this.querySelector('#integrations-drawer').classList.add('active');
        this.renderDrawerContent();
    }

    closeDrawer() {
        this.querySelector('#integrations-overlay').classList.remove('active');
        this.querySelector('#integrations-drawer').classList.remove('active');
    }

    renderDrawerContent() {
        const container = this.querySelector('#drawer-integrations-container');
        if (!this.user || !this.user.integrations) return;
        
        const notion = this.user.integrations.notion || {};
        const gcal = this.user.integrations.google_calendar || {};

        container.innerHTML = `
            <!-- Notion Card -->
            <div class="integration-card">
                <div class="integration-header">
                    <div class="integration-name">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8.342a2 2 0 0 0-.602-1.43l-4.44-4.342A2 2 0 0 0 14.53 2H6a2 2 0 0 0-2 2z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>
                        Notion
                    </div>
                    <div class="status-badge ${notion.connected ? 'connected' : 'disconnected'}">
                        ${notion.connected ? '• CONNECTED' : '• NOT CONNECTED'}
                    </div>
                </div>
                <div class="integration-form" id="form-notion">
                    <details class="setup-guide">
                        <summary>How to get Notion keys?</summary>
                        <div class="setup-guide-content">
                            <ol>
                                <li>Go to <a href="https://www.notion.so/my-integrations" target="_blank">Notion Integrations</a> and create a new integration. Copy the "Internal Integration Secret" (API Key).</li>
                                <li>Open your target Notion page, click the <b>...</b> menu (top right) → "Add connections" → select your integration.</li>
                                <li>Copy the 32-character ID from the URL of that page (e.g. <code>.../My-Page-1a2b3c...</code>).</li>
                            </ol>
                        </div>
                    </details>
                    <div class="input-group">
                        <label>API Key</label>
                        <input type="password" id="notion-key" placeholder="${notion.api_key_hint ? `Stored (${notion.api_key_hint})` : 'secret_...'}" />
                    </div>
                    <div class="input-group">
                        <label>Page ID</label>
                        <input type="text" id="notion-page" placeholder="32-char hex ID" value="${notion.page_id || ''}" />
                    </div>
                    <button class="drawer-btn" id="save-notion">Save Notion</button>
                </div>
            </div>

            <!-- Google Calendar Card -->
            <div class="integration-card">
                <div class="integration-header">
                    <div class="integration-name">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        Google Calendar
                    </div>
                    <div class="status-badge ${gcal.connected ? 'connected' : 'disconnected'}">
                        ${gcal.connected ? '• CONNECTED' : '• NOT CONNECTED'}
                    </div>
                </div>
                <div class="integration-form" id="form-gcal">
                    <details class="setup-guide">
                        <summary>How to setup Google Calendar?</summary>
                        <div class="setup-guide-content">
                            <ol>
                                <li>Use <b>primary</b> to connect your main calendar, or paste a specific Calendar ID from settings.</li>
                                <li>If you want OmniD3sk to act as a Service Account, create one in Google Cloud Console, download the JSON key, and paste its contents here.</li>
                                <li><i>Important:</i> If using a Service Account, remember to share your calendar with the service account's email address!</li>
                            </ol>
                        </div>
                    </details>
                    <div class="input-group">
                        <label>Calendar ID</label>
                        <input type="text" id="gcal-id" placeholder="primary or email@domain.com" value="${gcal.calendar_id || ''}" />
                    </div>
                    <div class="input-group">
                        <label>Service Account JSON (optional)</label>
                        <input type="password" id="gcal-json" placeholder="Paste full JSON key (leaves blank to keep current)" />
                    </div>
                    <button class="drawer-btn" id="save-gcal">Save Calendar</button>
                </div>
            </div>
        `;

        // Event Listeners for Save Buttons
        this.querySelector('#save-notion').addEventListener('click', async (e) => {
            const btn = e.target;
            const originalText = btn.innerText;
            btn.innerText = 'Saving...';
            
            const payload = {
                notion_api_key: this.querySelector('#notion-key').value || undefined,
                notion_page_id: this.querySelector('#notion-page').value || undefined
            };

            await this.saveIntegration(payload);
            btn.innerText = 'Saved!';
            setTimeout(() => btn.innerText = originalText, 2000);
        });

        this.querySelector('#save-gcal').addEventListener('click', async (e) => {
            const btn = e.target;
            const originalText = btn.innerText;
            btn.innerText = 'Saving...';
            
            let creds_json = undefined;
            const jsonVal = this.querySelector('#gcal-json').value;
            if (jsonVal) {
                try { creds_json = JSON.parse(jsonVal); } 
                catch(e) { alert('Invalid JSON format'); btn.innerText = originalText; return; }
            }

            const payload = {
                google_calendar_id: this.querySelector('#gcal-id').value || undefined,
                google_credentials_json: creds_json
            };

            await this.saveIntegration(payload);
            btn.innerText = 'Saved!';
            setTimeout(() => btn.innerText = originalText, 2000);
        });
    }

    async saveIntegration(payload) {
        const token = localStorage.getItem('omnid3sk_token');
        try {
            const res = await fetch('/api/integrations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                // Refresh auth state to update badges
                await this.initAuth();
                if (this.querySelector('#integrations-drawer').classList.contains('active')) {
                    this.renderDrawerContent();
                }
            }
        } catch(e) {
            console.error("Failed to save integration", e);
        }
    }
}

customElements.define('view-home', ViewHome);

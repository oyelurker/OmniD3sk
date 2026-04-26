import './view-home.js?v=bustcache3';
import './view-session.js?v=bustcache3';
import './view-summary.js?v=bustcache3';

class AppRoot extends HTMLElement {
    constructor() {
        super();
        this.state = {
            view: 'home',
        };
    }

    connectedCallback() {
        this.innerHTML = '';

        // Force strict dark mode for OmniD3sk branding
        document.body.classList.remove('light-mode');
        localStorage.setItem('theme', 'dark');

        // View Container
        this.viewContainer = document.createElement('div');
        this.viewContainer.style.height = '100%';
        this.viewContainer.style.width = '100%';
        this.appendChild(this.viewContainer);

        this.render();

        this.addEventListener('navigate', (e) => {
            this.state.view = e.detail.view;
            this.state.language = e.detail.language || 'English';
            this.state.token = e.detail.token || null;
            this.render();
        });
    }

    render() {
        if (!this.viewContainer) return;
        this.viewContainer.innerHTML = '';
        let currentView;
        switch (this.state.view) {
            case 'home':
                currentView = document.createElement('view-home');
                break;
            case 'session':
                currentView = document.createElement('view-session');
                currentView.setAttribute('language', this.state.language || 'English');
                break;
            case 'summary':
                currentView = document.createElement('view-summary');
                if (this.state.token) {
                    currentView.setAttribute('token', this.state.token);
                }
                break;
            default:
                currentView = document.createElement('view-home');
        }
        currentView.classList.add('fade-in');
        this.viewContainer.appendChild(currentView);
        
        // Remove the fade-in class after animation completes to destroy the transform containing block
        // This ensures position: fixed elements (like modals/drawers) work correctly relative to viewport
        setTimeout(() => {
            if (currentView && currentView.classList) {
                currentView.classList.remove('fade-in');
            }
        }, 650);
    }
}

customElements.define('app-root', AppRoot);

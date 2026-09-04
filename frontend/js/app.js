/**
 * NEXUS-JKN — Main Application Controller
 * Orchestrates data fetching and component initialization.
 */

const NexusApp = {
    API_BASE: '',
    statsData: null,
    graphData: null,
    anomaliesData: null,

    async init() {
        console.log('🛰️ NEXUS-JKN Initializing...');
        this.showLoading(true);

        try {
            // Fetch all data in parallel
            const [statsRes, graphRes, anomaliesRes] = await Promise.all([
                fetch(`${this.API_BASE}/api/stats`),
                fetch(`${this.API_BASE}/api/graph`),
                fetch(`${this.API_BASE}/api/anomalies`),
            ]);

            this.statsData = await statsRes.json();
            this.graphData = await graphRes.json();
            this.anomaliesData = await anomaliesRes.json();

            // Initialize components
            this.renderStats();
            NexusGraph.init(this.graphData);

            if (window.LiveStream) {
                LiveStream.init();
            }

            this.showLoading(false);
            console.log('✅ NEXUS-JKN Ready');

        } catch (err) {
            console.error('❌ Failed to initialize:', err);
            this.showLoading(false);
        }
    },

    renderStats() {
        const s = this.statsData;
        this.animateCounter('val-transaksi', 0, s.total_transaksi, 1200);
        this.animateCounter('val-anomali', 0, s.total_anomali, 1400);
        this.animateCounter('val-faskes', 0, s.faskes_terindikasi, 800);

        // Fraud rate with % sign
        const fraudEl = document.getElementById('val-fraud');
        this.animateCounter('val-fraud', 0, s.fraud_rate, 1600, (v) => `${v.toFixed(1)}%`);
    },

    animateCounter(elementId, from, to, duration, formatter = null) {
        const el = document.getElementById(elementId);
        if (!el) return;

        const startTime = performance.now();
        const isFloat = !Number.isInteger(to);

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing: ease-out-cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = from + (to - from) * eased;

            if (formatter) {
                el.textContent = formatter(current);
            } else {
                el.textContent = isFloat ? current.toFixed(1) : Math.round(current).toLocaleString('id-ID');
            }

            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }

        requestAnimationFrame(update);
    },

    showLoading(show) {
        let overlay = document.getElementById('loading-overlay');
        if (show) {
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'loading-overlay';
                overlay.className = 'loading-overlay';
                overlay.innerHTML = `
                    <div class="loading-spinner"></div>
                    <div class="loading-text">MEMUAT DATA NEXUS-JKN...</div>
                `;
                document.getElementById('graph-container').appendChild(overlay);
            }
        } else {
            if (overlay) {
                overlay.style.opacity = '0';
                overlay.style.transition = 'opacity 0.5s ease';
                setTimeout(() => overlay.remove(), 500);
            }
        }
    },

    updateLiveStats(data) {
        if (data.index) {
            document.getElementById('val-transaksi').textContent = data.index.toLocaleString('id-ID');
        }
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => NexusApp.init());

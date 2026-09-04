/**
 * NEXUS-JKN — WebSocket Live Stream Controller
 * Connects to /ws/live-stream backend endpoint and manages streaming playback controls.
 * Clean Light Theme & Iconify Icons.
 */

const LiveStream = {
    ws: null,
    isPlaying: false,
    isPaused: false,
    speed: 1.0,

    // UI Elements
    btnPlay: null,
    btnPause: null,
    btnStop: null,
    selectSpeed: null,
    streamCounter: null,
    progressFill: null,
    tickerContent: null,
    statusBadge: null,

    init() {
        this.btnPlay = document.getElementById('btn-play');
        this.btnPause = document.getElementById('btn-pause');
        this.btnStop = document.getElementById('btn-stop');
        this.selectSpeed = document.getElementById('select-speed');
        this.streamCounter = document.getElementById('stream-counter');
        this.progressFill = document.getElementById('progress-fill');
        this.tickerContent = document.getElementById('ticker-content');
        this.statusBadge = document.getElementById('status-badge');

        if (!this.btnPlay) return;

        // Bind control buttons
        this.btnPlay.addEventListener('click', () => this.handlePlay());
        this.btnPause.addEventListener('click', () => this.handlePause());
        this.btnStop.addEventListener('click', () => this.handleStop());
        this.selectSpeed.addEventListener('change', (e) => this.handleSpeedChange(e.target.value));

        // Connect WebSocket lazily on first play or preload
        this.connect();
    },

    connect() {
        if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
            return;
        }

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host || 'localhost:8000';
        const wsUrl = `${protocol}//${host}/ws/live-stream`;

        console.log(`🔌 Connecting WebSocket to ${wsUrl}...`);
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
            console.log('✅ WebSocket Connected');
        };

        this.ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                this.handleMessage(msg);
            } catch (err) {
                console.error('❌ Error parsing WS message:', err);
            }
        };

        this.ws.onclose = () => {
            console.log('🔌 WebSocket Disconnected');
            this.updateUiState('stopped');
        };

        this.ws.onerror = (err) => {
            console.error('❌ WebSocket Error:', err);
        };
    },

    handlePlay() {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            this.connect();
            setTimeout(() => this.handlePlay(), 500);
            return;
        }

        const speedVal = parseFloat(this.selectSpeed.value);

        if (this.isPaused) {
            // Resume
            this.ws.send(JSON.stringify({ action: 'resume' }));
        } else {
            // Start fresh
            this.ws.send(JSON.stringify({ action: 'start', speed: speedVal }));
        }
    },

    handlePause() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ action: 'pause' }));
        }
    },

    handleStop() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ action: 'stop' }));
        }
    },

    handleSpeedChange(speedVal) {
        const speed = parseFloat(speedVal);
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ action: 'set_speed', speed: speed }));
        }
    },

    handleMessage(msg) {
        if (msg.type === 'transaction') {
            this.renderTransaction(msg);
        } else if (msg.type === 'status') {
            this.updateUiState(msg.status, msg);
        }
    },

    renderTransaction(msg) {
        const d = msg.data;
        const index = msg.index;
        const total = msg.total;

        // Update Counter & Progress Bar
        this.streamCounter.textContent = `${index.toLocaleString('id-ID')} / ${total.toLocaleString('id-ID')}`;
        const pct = Math.min((index / total) * 100, 100);
        this.progressFill.style.width = `${pct}%`;

        // Format Ticker Text using Iconify icons
        const timeStr = d.timestamp.split(' ')[1] || d.timestamp;
        const text = `[${timeStr}] ${d.faskes_asal} ➔ ${d.faskes_tujuan} | Pasien: ${d.id_pasien} | ICD: ${d.kode_icd10} (${d.jarak_km.toFixed(1)}km)`;

        if (msg.is_fraud) {
            this.tickerContent.className = 'fraud';
            this.tickerContent.innerHTML = `<iconify-icon icon="lucide:shield-alert" style="color: var(--accent-red); font-size: 16px;"></iconify-icon> <span style="font-weight: 800; color: var(--accent-red); margin-right: 6px;">[ANOMALI DETECTED]</span> ${text}`;
        } else {
            this.tickerContent.className = '';
            this.tickerContent.innerHTML = `<iconify-icon icon="lucide:check-circle-2" style="color: var(--accent-emerald); font-size: 16px; margin-right: 4px;"></iconify-icon> ${text}`;
        }

        // Update overall stats counter if NexusApp exists
        if (window.NexusApp && window.NexusApp.updateLiveStats) {
            window.NexusApp.updateLiveStats(msg);
        }
    },

    updateUiState(status, meta = {}) {
        switch (status) {
            case 'started':
            case 'resumed':
                this.isPlaying = true;
                this.isPaused = false;
                this.btnPlay.disabled = true;
                this.btnPause.disabled = false;
                this.btnStop.disabled = false;
                this.updateStatusBadge('LIVE STREAMING', 'green');
                break;

            case 'paused':
                this.isPlaying = false;
                this.isPaused = true;
                this.btnPlay.disabled = false;
                this.btnPause.disabled = true;
                this.btnStop.disabled = false;
                this.updateStatusBadge('STREAM PAUSED', 'orange');
                this.tickerContent.innerHTML = `<iconify-icon icon="lucide:pause-circle" style="color: var(--accent-amber); margin-right: 4px;"></iconify-icon> Simulasi streaming dihentikan sementara (Paused)...`;
                break;

            case 'stopped':
            case 'completed':
                this.isPlaying = false;
                this.isPaused = false;
                this.btnPlay.disabled = false;
                this.btnPause.disabled = true;
                this.btnStop.disabled = true;
                this.updateStatusBadge('SYSTEM READY', 'green');

                if (status === 'completed') {
                    this.tickerContent.innerHTML = `<iconify-icon icon="lucide:check-check" style="color: var(--accent-emerald); margin-right: 4px;"></iconify-icon> Simulasi streaming 5.000 data rujukan selesai!`;
                    this.progressFill.style.width = '100%';
                } else {
                    this.tickerContent.innerHTML = `Klik tombol Play untuk memulai simulasi streaming data real-time...`;
                    this.progressFill.style.width = '0%';
                    this.streamCounter.textContent = '0 / 5.000';
                }
                break;
        }
    },

    updateStatusBadge(text, color) {
        if (!this.statusBadge) return;
        const pulseDot = this.statusBadge.querySelector('.pulse-dot');
        const textSpan = this.statusBadge.querySelector('span:last-child');

        if (pulseDot) {
            pulseDot.className = `pulse-dot ${color}`;
        }
        if (textSpan) {
            textSpan.textContent = text;
        }
    }
};

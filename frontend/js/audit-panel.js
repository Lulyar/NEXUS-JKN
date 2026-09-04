/**
 * NEXUS-JKN — XAI Audit Panel Controller
 * Executive Blue & Cyan Palette with VIBRANT RED FRAUD INDICATOR.
 */

const AuditPanel = {
    panelEl: null,
    contentEl: null,
    closeBtnEl: null,
    graphContainerEl: null,

    init() {
        this.panelEl = document.getElementById('audit-panel');
        this.contentEl = document.getElementById('audit-content');
        this.closeBtnEl = document.getElementById('btn-close-panel');
        this.graphContainerEl = document.getElementById('graph-container');

        if (this.closeBtnEl) {
            this.closeBtnEl.addEventListener('click', () => this.close());
        }
    },

    async open(source, target) {
        if (!this.panelEl) this.init();

        // Highlight selected edge in Cytoscape graph
        if (window.NexusGraph) {
            NexusGraph.highlightEdge(source, target);
        }

        // Open panel layout immediately with loading spinner
        this.panelEl.classList.remove('hidden');
        if (this.graphContainerEl) {
            this.graphContainerEl.classList.add('panel-open');
        }

        this.contentEl.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 300px; gap: 16px;">
                <div class="loading-spinner"></div>
                <div style="color: var(--text-secondary); font-size: 13px; font-family: 'JetBrains Mono', monospace; font-weight: 600;">
                    MEMUAT BUKTI XAI AUDIT...
                </div>
            </div>
        `;

        try {
            const url = `/api/audit/${encodeURIComponent(source)}/${encodeURIComponent(target)}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            this.render(data);
        } catch (err) {
            console.error('❌ Failed to fetch audit evidence:', err);
            this.contentEl.innerHTML = `
                <div class="audit-narrative" style="border-color: #ef4444;">
                    <strong><iconify-icon icon="lucide:alert-circle" style="vertical-align: text-bottom; color: #ef4444;"></iconify-icon> Gagal Memuat Data Audit</strong><br>
                    Terjadi kesalahan saat mengambil bukti audit dari backend.
                </div>
            `;
        }
    },

    close() {
        if (!this.panelEl) this.init();
        this.panelEl.classList.add('hidden');
        if (this.graphContainerEl) {
            this.graphContainerEl.classList.remove('panel-open');
        }
        if (window.NexusGraph) {
            NexusGraph.resetHighlight();
        }
    },

    render(data) {
        const anomaly = data.anomaly || {};
        const metrics = data.edge_metrics || {};
        const score = anomaly.fraud_score !== undefined ? anomaly.fraud_score : 0.0;
        const scorePct = Math.round(score * 100);

        // Determine risk badge label
        let riskLabel = anomaly.risk_level || 'SEDANG';
        let riskIcon = 'lucide:alert-circle';
        if (score >= 0.8) {
            riskLabel = 'SANGAT TINGGI';
            riskIcon = 'lucide:shield-alert';
        } else if (score >= 0.65) {
            riskLabel = 'TINGGI';
            riskIcon = 'lucide:alert-triangle';
        } else if (score < 0.5) {
            riskLabel = 'NORMAL / LOW';
            riskIcon = 'lucide:check-circle-2';
        }

        // Render ICD breakdown bars
        const icdBreakdown = metrics.icd_breakdown || {};
        const totalCount = metrics.count || 1;
        let icdHtml = '';

        for (const [icd, count] of Object.entries(icdBreakdown)) {
            const pct = ((count / totalCount) * 100).toFixed(1);
            let barStyle = 'background: var(--blue-primary);';
            if (icd === 'J00') barStyle = 'background: #ef4444;';

            icdHtml += `
                <div class="icd-bar-container">
                    <div class="icd-bar-label">
                        <span class="icd-code">${icd} (${this.getIcdName(icd)})</span>
                        <span class="icd-count">${count} (${pct}%)</span>
                    </div>
                    <div class="icd-bar-track">
                        <div class="icd-bar-fill" style="width: ${pct}%; ${barStyle}"></div>
                    </div>
                </div>
            `;
        }

        // Render transactions table (top 15 rows for display)
        const txs = (data.transactions || []).slice(0, 15);
        let txRowsHtml = txs.map(tx => `
            <tr>
                <td>${tx.id_pasien || tx.id_rujukan}</td>
                <td>${tx.kode_icd10}</td>
                <td>${tx.jarak_km ? tx.jarak_km.toFixed(1) + ' km' : '—'}</td>
                <td><span class="fraud-tag" style="${tx.kode_icd10 === 'J00' ? 'background: #fff1f2; color: #ef4444;' : 'background: var(--blue-tint); color: var(--blue-primary);'}">${tx.kode_icd10 === 'J00' ? 'ANOMALI' : 'RUJUKAN'}</span></td>
            </tr>
        `).join('');

        const safeSource = (data.source || '').replace(/'/g, "\\'");
        const safeTarget = (data.target || '').replace(/'/g, "\\'");

        this.contentEl.innerHTML = `
            <!-- Header Nodes Info -->
            <div style="margin-bottom: 18px; padding-bottom: 14px; border-bottom: 1px solid var(--border-color);">
                <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">ALUR RUJUKAN DIANALISIS</div>
                <div style="font-size: 14px; font-weight: 700; color: var(--blue-primary); display: flex; align-items: center; gap: 6px;">
                    <iconify-icon icon="lucide:building-2"></iconify-icon>
                    ${data.source}
                </div>
                <div style="font-size: 12px; color: var(--text-muted); margin: 4px 0 4px 20px; display: flex; align-items: center; gap: 4px;">
                    <iconify-icon icon="lucide:arrow-down-right" style="color: #ef4444;"></iconify-icon>
                    <span style="font-weight: 600; color: #ef4444;">(Rujukan Berulang Semu)</span>
                </div>
                <div style="font-size: 14px; font-weight: 700; color: #ef4444; display: flex; align-items: center; gap: 6px;">
                    <iconify-icon icon="lucide:hospital"></iconify-icon>
                    ${data.target}
                </div>
            </div>

            <!-- Fraud Score Display -->
            <div class="fraud-score-display" style="border-left: 4px solid #ef4444;">
                <div class="fraud-score-header">
                    <div>
                        <div style="font-size: 11px; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Skor Anomali / Fraud</div>
                        <div class="fraud-score-value" style="color: #ef4444;">${scorePct} <span style="font-size: 14px; font-weight: 600; color: var(--text-secondary);">/ 100</span></div>
                    </div>
                    <span class="risk-badge" style="background: #fff1f2; color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3);">
                        <iconify-icon icon="${riskIcon}"></iconify-icon>
                        ${riskLabel}
                    </span>
                </div>
                <div class="fraud-score-bar-track">
                    <div class="fraud-score-bar-fill" style="width: ${scorePct}%; background: linear-gradient(90deg, #f59e0b, #ef4444);"></div>
                </div>
            </div>

            <!-- XAI Narrative Narrative -->
            <div class="audit-narrative" style="background: #fff1f2; border: 1px solid rgba(239,68,68,0.2); color: #9f1239;">
                <strong style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px; color: #881337;">
                    <iconify-icon icon="lucide:bot" style="font-size: 16px; color: #ef4444;"></iconify-icon>
                    Narasi Intelijen XAI:
                </strong>
                ${data.narrative}
            </div>

            <!-- 4 Metric Cards (2x2 Grid) -->
            <div class="audit-metrics">
                <div class="metric-card">
                    <span class="metric-value" style="color: #ef4444;">${metrics.concentration_pct}%</span>
                    <span class="metric-label">Konsentrasi Rujukan</span>
                </div>
                <div class="metric-card">
                    <span class="metric-value" style="color: #ef4444;">${metrics.mild_diagnosis_pct}%</span>
                    <span class="metric-label">Diagnosa Ringan</span>
                </div>
                <div class="metric-card">
                    <span class="metric-value" style="color: var(--cyan-dark);">${metrics.avg_distance_km ? metrics.avg_distance_km.toFixed(1) : 0} km</span>
                    <span class="metric-label">Rata-rata Jarak</span>
                </div>
                <div class="metric-card">
                    <span class="metric-value" style="color: var(--blue-primary);">${metrics.count.toLocaleString('id-ID')}</span>
                    <span class="metric-label">Total Rujukan</span>
                </div>
            </div>

            <!-- ICD Breakdown Section -->
            <div class="audit-section-title">
                <iconify-icon icon="lucide:bar-chart-2" style="font-size: 14px;"></iconify-icon>
                Distribusi Diagnosa (ICD-10)
            </div>
            <div style="margin-bottom: 20px;">
                ${icdHtml}
            </div>

            <!-- Transaction Log Sample Section -->
            <div class="audit-section-title">
                <iconify-icon icon="lucide:file-text" style="font-size: 14px;"></iconify-icon>
                Sampel Transaksi Rujukan
            </div>
            <div style="max-height: 220px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: 10px; overflow: hidden;">
                <table class="tx-table">
                    <thead>
                        <tr>
                            <th>ID Pasien</th>
                            <th>ICD-10</th>
                            <th>Jarak</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${txRowsHtml}
                    </tbody>
                </table>
            </div>

            <!-- Audit Action Buttons -->
            <div class="audit-actions">
                <button class="audit-btn danger" onclick="AuditPanel.showToast('Transaksi rujukan ${safeSource} ➔ ${safeTarget} telah ditandai untuk Tim Audit Investigasi BPJS!', 'danger', 'lucide:flag-triangle-right')">
                    <iconify-icon icon="lucide:flag-triangle-right"></iconify-icon>
                    Tandai untuk Audit
                </button>
                <button class="audit-btn outline" onclick="AuditPanel.showToast('Mengunduh Laporan Bukti Digital XAI (PDF)...', 'success', 'lucide:download')">
                    <iconify-icon icon="lucide:download"></iconify-icon>
                    Cetak Bukti PDF
                </button>
            </div>
        `;
    },

    getIcdName(code) {
        const names = {
            'J00': 'ISPA / Acute nasopharyngitis',
            'A09': 'Diare & Gastroenteritis',
            'K29': 'Gastritis',
            'R50': 'Demam',
            'I10': 'Hipertensi',
            'E11': 'Diabetes Mellitus',
            'M54': 'Nyeri Punggung',
        };
        return names[code] || 'Diagnosa Medis';
    },

    showToast(message, type = 'success', icon = 'lucide:check-circle') {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type === 'danger' ? 'toast-danger' : 'toast-success'}`;
        toast.innerHTML = `
            <iconify-icon icon="${icon}" style="font-size: 20px; color: ${type === 'danger' ? '#ef4444' : 'var(--blue-primary)'}; flex-shrink: 0;"></iconify-icon>
            <div>${message}</div>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('toast-out');
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }
};

// Initialize listeners on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => AuditPanel.init());

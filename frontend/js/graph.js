/**
 * NEXUS-JKN — Cytoscape.js Graph Renderer
 * Executive Blue & Cyan theme with VIBRANT RED FRAUD EDGE.
 */

const NexusGraph = {
    cy: null,

    init(graphData) {
        const container = document.getElementById('graph-canvas');

        // Build Cytoscape elements
        const elements = [];

        graphData.nodes.forEach(node => {
            elements.push({
                group: 'nodes',
                data: node.data,
            });
        });

        graphData.edges.forEach(edge => {
            elements.push({
                group: 'edges',
                data: edge.data,
            });
        });

        // Initialize Cytoscape
        this.cy = cytoscape({
            container: container,
            elements: elements,
            userZoomingEnabled: true,
            userPanningEnabled: true,
            boxSelectionEnabled: false,

            style: [
                // ─── FKTP Nodes (Clinics - Ocean Blue) ───
                {
                    selector: 'node[node_type="FKTP"]',
                    style: {
                        'background-color': '#2563eb',
                        'border-color': '#1d4ed8',
                        'border-width': 2,
                        'border-opacity': 0.8,
                        'label': 'data(label)',
                        'color': '#0f172a',
                        'font-size': '10px',
                        'font-family': 'Inter, sans-serif',
                        'font-weight': 600,
                        'text-valign': 'bottom',
                        'text-halign': 'center',
                        'text-margin-y': 8,
                        'text-wrap': 'wrap',
                        'text-max-width': '110px',
                        'width': 'mapData(total_referrals, 50, 1500, 26, 56)',
                        'height': 'mapData(total_referrals, 50, 1500, 26, 56)',
                        'shadow-blur': 12,
                        'shadow-color': 'rgba(37, 99, 235, 0.25)',
                        'shadow-offset-x': 0,
                        'shadow-offset-y': 2,
                        'shadow-opacity': 0.6,
                        'transition-property': 'background-color, border-color, width, height, shadow-blur',
                        'transition-duration': '0.3s',
                    }
                },
                // ─── FKTP Anomaly Nodes ───
                {
                    selector: 'node[node_type="FKTP"][?anomaly]',
                    style: {
                        'background-color': '#f59e0b',
                        'border-color': '#d97706',
                        'color': '#78350f',
                        'shadow-color': 'rgba(245, 158, 11, 0.4)',
                        'shadow-blur': 20,
                    }
                },
                // ─── FKRTL Nodes (Hospitals - Slate Cyan Hexagon) ───
                {
                    selector: 'node[node_type="FKRTL"]',
                    style: {
                        'background-color': '#0284c7',
                        'border-color': '#0369a1',
                        'border-width': 2,
                        'border-opacity': 0.8,
                        'shape': 'hexagon',
                        'label': 'data(label)',
                        'color': '#0f172a',
                        'font-size': '10px',
                        'font-family': 'Inter, sans-serif',
                        'font-weight': 700,
                        'text-valign': 'bottom',
                        'text-halign': 'center',
                        'text-margin-y': 10,
                        'text-wrap': 'wrap',
                        'text-max-width': '120px',
                        'width': 42,
                        'height': 42,
                        'shadow-blur': 16,
                        'shadow-color': 'rgba(2, 132, 199, 0.3)',
                        'shadow-offset-x': 0,
                        'shadow-offset-y': 2,
                        'shadow-opacity': 0.6,
                        'transition-property': 'background-color, border-color, shadow-blur',
                        'transition-duration': '0.3s',
                    }
                },
                // ─── FKRTL Anomaly Nodes (Vibrant Red Hexagon) ───
                {
                    selector: 'node[node_type="FKRTL"][?anomaly]',
                    style: {
                        'background-color': '#ef4444',
                        'border-color': '#b91c1c',
                        'color': '#7f1d1d',
                        'shadow-color': 'rgba(239, 68, 68, 0.6)',
                        'shadow-blur': 25,
                    }
                },
                // ─── Normal Edges ───
                {
                    selector: 'edge',
                    style: {
                        'width': 'mapData(count, 1, 200, 1.5, 4)',
                        'line-color': 'rgba(148, 163, 184, 0.45)',
                        'target-arrow-color': 'rgba(148, 163, 184, 0.6)',
                        'target-arrow-shape': 'triangle',
                        'arrow-scale': 0.85,
                        'curve-style': 'bezier',
                        'opacity': 0.6,
                        'transition-property': 'line-color, width, opacity',
                        'transition-duration': '0.3s',
                    }
                },
                // ─── Fraud Edges (KHUSUS MERAH VIBRANT) ───
                {
                    selector: 'edge[?anomaly]',
                    style: {
                        'width': 'mapData(count, 100, 1200, 4, 8)',
                        'line-color': '#ef4444',
                        'target-arrow-color': '#ef4444',
                        'target-arrow-shape': 'triangle',
                        'arrow-scale': 1.0,
                        'curve-style': 'bezier',
                        'opacity': 1,
                        'shadow-blur': 15,
                        'shadow-color': 'rgba(239, 68, 68, 0.6)',
                        'shadow-opacity': 0.8,
                    }
                },
                // ─── Active States ───
                {
                    selector: 'node:active',
                    style: {
                        'overlay-opacity': 0.1,
                        'overlay-color': '#2563eb',
                    }
                },
                {
                    selector: 'edge:active',
                    style: {
                        'overlay-opacity': 0.1,
                    }
                },
            ],

            layout: {
                name: 'cose',
                animate: true,
                animationDuration: 1500,
                animationEasing: 'ease-in-out-cubic',
                nodeRepulsion: function() { return 120000; },
                idealEdgeLength: function(edge) {
                    return edge.data('anomaly') ? 220 : 140;
                },
                edgeElasticity: function() { return 100; },
                gravity: 0.25,
                numIter: 1500,
                padding: 60,
                randomize: false,
                componentSpacing: 100,
            },
        });

        // ─── Event: Click on edge ───
        this.cy.on('tap', 'edge', (evt) => {
            const edge = evt.target;
            const source = edge.data('source');
            const target = edge.data('target');
            AuditPanel.open(source, target);
        });

        // ─── Event: Click on node ───
        this.cy.on('tap', 'node', (evt) => {
            const node = evt.target;
            // Highlight connected edges
            this.cy.edges().style('opacity', 0.15);
            node.connectedEdges().style('opacity', 1);
        });

        // ─── Event: Click on background ───
        this.cy.on('tap', (evt) => {
            if (evt.target === this.cy) {
                // Reset all styles
                this.cy.edges().removeStyle('opacity');
            }
        });

        // ─── Edge pulsing animation for fraud edges ───
        this.startFraudPulse();

        // ─── Graph Controls ───
        document.getElementById('btn-fit').addEventListener('click', () => {
            this.cy.fit(null, 60);
        });
        document.getElementById('btn-zoom-in').addEventListener('click', () => {
            this.cy.zoom(this.cy.zoom() * 1.3);
        });
        document.getElementById('btn-zoom-out').addEventListener('click', () => {
            this.cy.zoom(this.cy.zoom() * 0.7);
        });
    },

    startFraudPulse() {
        const fraudEdges = this.cy.edges('[?anomaly]');
        let glowing = true;

        setInterval(() => {
            if (glowing) {
                fraudEdges.animate({
                    style: { 'shadow-blur': 25, 'shadow-opacity': 0.9, 'opacity': 1 },
                    duration: 800,
                    easing: 'ease-in-out-sine',
                });
            } else {
                fraudEdges.animate({
                    style: { 'shadow-blur': 6, 'shadow-opacity': 0.3, 'opacity': 0.75 },
                    duration: 800,
                    easing: 'ease-in-out-sine',
                });
            }
            glowing = !glowing;
        }, 900);
    },

    highlightEdge(source, target) {
        // Dim all, highlight specific edge
        this.cy.edges().style('opacity', 0.1);
        this.cy.nodes().style('opacity', 0.3);

        const edge = this.cy.edges(`[source="${source}"][target="${target}"]`);
        const srcNode = this.cy.getElementById(source);
        const tgtNode = this.cy.getElementById(target);

        edge.style('opacity', 1);
        srcNode.style('opacity', 1);
        tgtNode.style('opacity', 1);
    },

    resetHighlight() {
        this.cy.edges().removeStyle('opacity');
        this.cy.nodes().removeStyle('opacity');
    },
};

import React, { useEffect, useState } from 'react';
import { usePockets } from '../../hooks/usePockets';
import { PrimaryButton } from '../Button/Button';
import './PocketCarousel.css';

const PocketCarousel = ({ portofolioId, onSelect, selectedPocketId }) => {
    const { pockets, fetchPocketsByPortofolio, loadingPockets } = usePockets();
    const [now, setNow] = useState(new Date());

    // Actualizăm "acum" la fiecare minut pentru a reîmprospăta cronometrele din listă
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const statusConfig = {
        Open: { color: '#00ff88', label: 'Open', timerLabel: 'UPTIME' },
        Closed: { color: '#ff4444', label: 'Closed', timerLabel: 'DOWNTIME' }
    };

    // Funcție internă pentru calculul duratei
    const formatDuration = (updatedAt) => {
        if (!updatedAt) return "0m";
        const diffInMs = now - new Date(updatedAt);
        const diffInMins = Math.floor(diffInMs / (1000 * 60));

        if (diffInMins < 60) return `${diffInMins}m`;
        const diffInHours = Math.floor(diffInMins / 60);
        if (diffInHours < 24) return `${diffInHours}h`;
        return `${Math.floor(diffInHours / 24)}d`;
    };

    useEffect(() => {
        if (portofolioId) {
            fetchPocketsByPortofolio(portofolioId).then(data => {
                if (data && data.length > 0 && !selectedPocketId) {
                    onSelect(data[0]);
                }
            });
        }
    }, [portofolioId, fetchPocketsByPortofolio, onSelect, selectedPocketId]);

    if (loadingPockets) return <div className="loading-small">Syncing Pockets...</div>;

    return (
        <div className="pockets-selection-side">
            <div className="section-header">
                <h3>Unit Pockets</h3>
                <PrimaryButton size="sm" onClick={() => console.log('Add Pocket')}>
                    + Add Pocket
                </PrimaryButton>
            </div>

            <div className="pockets-static-list">
                {pockets.map((pocket, idx) => {
                    const isSelected = selectedPocketId === pocket._id;
                    const config = statusConfig[pocket.status] || { color: '#eee', label: pocket.status, timerLabel: 'IDLE' };

                    return (
                        <div
                            key={pocket._id}
                            className={`pocket-mini-card ${isSelected ? 'active' : ''}`}
                            onClick={() => onSelect(pocket)}
                            style={{ borderLeft: `4px solid ${config.color}` }}
                        >
                            <div className="p-card-content">
                                <div className="p-index-box">
                                    <span className="p-index" style={{ color: config.color }}>
                                        P{idx + 1}
                                    </span>
                                </div>

                                <div className="p-info">
                                    <span className="p-currency">{pocket.currency}</span>
                                    <span className="p-status-text" style={{ color: config.color }}>
                                        {config.label}
                                    </span>
                                </div>

                                <div className="p-timer-section">
                                    <span className="p-timer-label">{config.timerLabel}</span>
                                    <span className="p-timer-value">
                                        {formatDuration(pocket.updatedAt || pocket.lastTransactionDate)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PocketCarousel;
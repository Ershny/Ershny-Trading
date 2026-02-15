import React from 'react';
import { useNavigate } from 'react-router-dom';
import './PortofolioCard.css';

const PortofolioCard = ({ portofolio }) => {
    const navigate = useNavigate();

    const statusConfig = {
        Active: { color: '#00ff88', label: 'Active' },
        Paused: { color: '#ffbf00', label: 'Paused' },
        Inactive: { color: 'var(--error)', label: 'Inactive' }
    };

    const currentStatus = statusConfig[portofolio.status] || statusConfig.inactive;
    const occupiedCount = portofolio.pockets?.filter(p => p.is_occupied).length || 0;
    const totalPockets = portofolio.total_pockets || 0;

    const handleCardClick = () => {
        navigate(`/portofolios/${portofolio.id || portofolio._id}`);
    };

    return (
        <div className="portofolio-wide-card" onClick={handleCardClick}>
            {/* Secțiunea Stânga: Identitate, Status și Info */}
            <div className="port-main-info">
                <h2 className="port-name">{portofolio.name}</h2>

                {/* Status Indicator injectat aici */}
                <div className={`port-status-badge ${portofolio.status}`}>
                    <span
                        className="status-dot"
                        style={{ backgroundColor: currentStatus.color }}
                    ></span>
                    <span className="status-label" style={{ color: currentStatus.color }}>
                        {currentStatus.label}
                    </span>
                </div>

                <div className="port-stats">
                    <div className="stat-item">
                        <span className="stat-label">Total Pockets:</span>
                        <span className="stat-value">{totalPockets}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Occupancy:</span>
                        <span className={`stat-value ${occupiedCount === totalPockets ? 'full' : 'available'}`}>
                            {occupiedCount}/{totalPockets}
                        </span>
                    </div>
                </div>
            </div>

            {/* Secțiunea Dreapta: Vizualizare Sloturi (Pockets) */}
            <div className="pockets-container">
                {portofolio.pockets && portofolio.pockets.length > 0 ? (
                    portofolio.pockets.map((pocket, index) => (
                        <div
                            key={index}
                            className={`pocket-slot ${pocket.is_occupied ? 'occupied' : 'empty'}`}
                        >
                            <span className="pocket-index">P{index + 1}</span>
                            <span className="pocket-currency">
                                {pocket.is_occupied ? pocket.currency : 'EMPTY'}
                            </span>
                        </div>
                    ))
                ) : (
                    <div className="no-pockets-msg">No pockets configured for this unit.</div>
                )}
            </div>
        </div>
    );
};

export default PortofolioCard;
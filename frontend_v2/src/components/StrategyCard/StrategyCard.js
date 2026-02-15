import React from 'react';
import { PrimaryButton, ErrorButton } from '../Button/Button';
import './StrategyCard.css';

const StrategyCard = ({ config, onEdit, onDelete }) => {
    return (
        <div className="strategy-card">
            <div className="card-header">
                {config.is_bot_active && (
                    <div className="bot-status-indicator active">ACTIVE</div>
                )}
            </div>

            <h3 className="strategy-name">{config.strategy_name}</h3>

            <div className="assets-preview">
                <span className="label">Watched Assets</span>
                <div className="tag-container">
                    {config.watched_assets?.slice(0, 4).map(asset => (
                        <span key={asset} className="mini-tag">{asset}</span>
                    ))}
                    {config.watched_assets?.length > 4 && (
                        <span className="mini-tag">+{config.watched_assets.length - 4} more</span>
                    )}
                </div>
            </div>

            <div className="specs-grid">
                <div className="spec-box">
                    <span className="spec-label">Interval</span>
                    <span className="spec-value">
                    {config.check_interval_seconds}<span className="unit">s</span>
                    </span>
                </div>
                <div className="spec-box">
                    <span className="spec-label">RSI Target</span>
                    <span className="spec-value">
                        <span className="buy">{config.rsi_oversold}</span>
                        <span className="rsi-separator">/</span>
                        <span className="sell">{config.rsi_overbought}</span>
                    </span>
                </div>
            </div>

            <div className="card-footer">
                {/* Butonul de Edit - Stil Inverted */}
                <PrimaryButton
                    inverted={true}
                    onClick={() => onEdit(config.id || config._id)}
                    fullWidth={true}
                >
                    Edit
                </PrimaryButton>

                {/* Butonul de Delete - Folosim ErrorButton-ul tău */}
                <ErrorButton
                    inverted={true}
                    onClick={() => onDelete(config.id || config._id)}
                    fullWidth={true}
                >
                    Delete
                </ErrorButton>
            </div>
        </div>
    );
};

export default StrategyCard;
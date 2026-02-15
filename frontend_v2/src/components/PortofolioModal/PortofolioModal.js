import React, { useState } from 'react';
import { PrimaryButton, ErrorButton } from '../Button/Button';
import './PortofolioModal.css';

const PortofolioModal = ({ isOpen, onClose, onConfirm, configs }) => {
    const [name, setName] = useState('');
    const [configId, setConfigId] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    if (!isOpen) return null;

    const handleSelect = (cfg) => {
        setConfigId(cfg._id);
        setIsDropdownOpen(false);
    };

    const selectedConfigName = configs.find(c => c._id === configId)?.strategy_name || '-- Choose Strategy --';

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name || !configId) return;
        onConfirm({ name, configId: configId });
        setName('');
        setConfigId('');
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="archer-modal" onClick={e => e.stopPropagation()}>
                <h3 className="modal-title">Deploy New Unit</h3>

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Portofolio Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="ex: Alpha Scalper"
                            required
                        />
                    </div>

                    <div className="input-group" style={{ marginTop: '20px' }}>
                        <label>Select Strategy (Brain)</label>

                        {/* CUSTOM DROPDOWN */}
                        <div className={`custom-select ${isDropdownOpen ? 'open' : ''}`}>
                            <div className="select-trigger" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                                <span>{selectedConfigName}</span>
                                <div className="arrow"></div>
                            </div>

                            {isDropdownOpen && (
                                <div className="select-options">
                                    {configs.map(cfg => (
                                        <div
                                            key={cfg._id}
                                            className={`select-option ${configId === cfg._id ? 'selected' : ''}`}
                                            onClick={() => handleSelect(cfg)}
                                        >
                                            {cfg.strategy_name}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="modal-actions">
                        <PrimaryButton type="submit" inverted fullWidth>
                            Deploy Portofolio
                        </PrimaryButton>

                        <ErrorButton type="button" inverted fullWidth onClick={onClose}>
                            Cancel Deployment
                        </ErrorButton>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PortofolioModal;
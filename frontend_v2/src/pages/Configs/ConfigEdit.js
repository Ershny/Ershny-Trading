import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useConfigs } from '../../hooks/useConfigs';
import { useAssets } from '../../hooks/useAssets';
import PageHeader from '../../components/PageHeader/PageHeader';
import { PrimaryButton } from '../../components/Button/Button';
import './ConfigEdit.css';

const ConfigEdit = () => {
    const { id } = useParams(); // Extragem ID-ul din URL
    const navigate = useNavigate();
    const isEditMode = Boolean(id); // Dacă avem ID, suntem pe modul Edit

    const { createConfig, updateConfig, fetchConfigById } = useConfigs();
    const { availableAssets, fetchAssets, loadingAssets } = useAssets();

    const [formData, setFormData] = useState({
        strategy_name: '',
        check_interval_seconds: 60,
        rsi_period: 14,
        rsi_overbought: 70,
        rsi_oversold: 30,
        profit_target_percent: 2.0,
        stop_loss_percent: 1.5,
        is_bot_active: false
    });

    const [selectedAssets, setSelectedAssets] = useState([]);
    const [fetchingData, setFetchingData] = useState(isEditMode);

    // 1. Fetch assets available
    useEffect(() => {
        fetchAssets().catch((err) => {
            console.error("Archer: Failed to fetch assets", err);
        });
    }, [fetchAssets]);

    // 2. Fetch config data if in Edit Mode
    useEffect(() => {
        if (isEditMode) {
            const loadConfig = async () => {
                try {
                    const data = await fetchConfigById(id);
                    if (data) {
                        // Mapăm datele primite în state-ul local
                        setFormData({
                            strategy_name: data.strategy_name || '',
                            check_interval_seconds: data.check_interval_seconds || 60,
                            rsi_period: data.rsi_period || 14,
                            rsi_overbought: data.rsi_overbought || 70,
                            rsi_oversold: data.rsi_oversold || 30,
                            profit_target_percent: data.profit_target_percent || 2.0,
                            stop_loss_percent: data.stop_loss_percent || 1.5,
                            is_bot_active: data.is_bot_active || false
                        });
                        setSelectedAssets(data.watched_assets || []);
                    }
                } catch (err) {
                    console.error("Archer: Error loading configuration", err);
                } finally {
                    setFetchingData(false);
                }
            };
            loadConfig();
        }
    }, [id, isEditMode, fetchConfigById]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) : value)
        }));
    };

    const toggleAsset = (symbol) => {
        if (selectedAssets.includes(symbol)) {
            setSelectedAssets(selectedAssets.filter(item => item !== symbol));
        } else {
            setSelectedAssets([...selectedAssets, symbol]);
        }
    };

    const handleSubmit = async (e) => {
        if (e && e.preventDefault) e.preventDefault();

        const payload = {
            ...formData,
            watched_assets: selectedAssets
        };

        if (selectedAssets.length === 0) {
            alert("Archer: You can't hunt without arrows. Select at least one asset!");
            return;
        }

        let success;
        if (isEditMode) {
            success = await updateConfig(id, payload);
        } else {
            success = await createConfig(payload);
        }

        if (success) {
            navigate('/configs');
        }
    };

    if (fetchingData) {
        return <div className="loading-text">Synchronizing strategy parameters...</div>;
    }

    return (
        <div className="config-edit-page">
            <PageHeader variant="normal" color="accent">
                {isEditMode ? `Edit Strategy: ${formData.strategy_name}` : 'Create New Strategy'}
            </PageHeader>

            <div className="edit-layout">
                {/* --- STÂNGA: FORMULAR --- */}
                <form id="strategy-form" className="config-form" onSubmit={handleSubmit}>
                    <section className="form-section">
                        <h3 className="section-title">Core Identity</h3>
                        <div className="input-group">
                            <label>Strategy Name</label>
                            <input
                                name="strategy_name"
                                type="text"
                                placeholder="e.g. Scalp Sniper v1"
                                value={formData.strategy_name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label>Check Interval (seconds)</label>
                            <input name="check_interval_seconds" type="number" value={formData.check_interval_seconds} onChange={handleChange} />
                        </div>
                    </section>

                    <section className="form-section">
                        <h3 className="section-title">Technical Indicators (RSI)</h3>
                        <div className="input-row">
                            <div className="input-group">
                                <label>Period</label>
                                <input name="rsi_period" type="number" value={formData.rsi_period} onChange={handleChange} />
                            </div>
                            <div className="input-group">
                                <label>Oversold</label>
                                <input name="rsi_oversold" type="number" value={formData.rsi_oversold} onChange={handleChange} />
                            </div>
                            <div className="input-group">
                                <label>Overbought</label>
                                <input name="rsi_overbought" type="number" value={formData.rsi_overbought} onChange={handleChange} />
                            </div>
                        </div>
                    </section>

                    <section className="form-section">
                        <h3 className="section-title">Risk Management</h3>
                        <div className="input-row">
                            <div className="input-group">
                                <label>Take Profit (%)</label>
                                <input name="profit_target_percent" type="number" step="0.1" value={formData.profit_target_percent} onChange={handleChange} />
                            </div>
                            <div className="input-group">
                                <label>Stop Loss (%)</label>
                                <input name="stop_loss_percent" type="number" step="0.1" value={formData.stop_loss_percent} onChange={handleChange} />
                            </div>
                        </div>
                    </section>
                </form>

                {/* --- DREAPTA: ASSET SELECTOR --- */}
                <div className="asset-selector-column">
                    <section className="asset-section">
                        <h3 className="section-title">Targeted Assets</h3>
                        <div className="selected-preview-area">
                            {selectedAssets.length > 0 ? (
                                <div className="assets-grid-mini">
                                    {selectedAssets.map(asset => (
                                        <div key={asset} className="asset-box-mini active" onClick={() => toggleAsset(asset)}>
                                            {asset}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="empty-msg">No assets selected.</p>
                            )}
                        </div>
                    </section>

                    <section className="asset-section">
                        <h3 className="section-title">Available Markets</h3>
                        {loadingAssets ? (
                            <p className="loading-text">Synchronizing...</p>
                        ) : (
                            <div className="assets-grid">
                                {availableAssets
                                    .filter(asset => !selectedAssets.includes(asset))
                                    .map(asset => (
                                        <div
                                            key={asset}
                                            className="asset-box"
                                            onClick={() => toggleAsset(asset)}
                                        >
                                            {asset}
                                        </div>
                                    ))}
                            </div>
                        )}
                    </section>
                </div>
            </div>

            {/* --- ACTION BAR GLOBAL --- */}
            <div className="global-form-footer">
                <PrimaryButton inverted={true} onClick={() => navigate('/configs')}>
                    Cancel
                </PrimaryButton>

                <PrimaryButton onClick={handleSubmit}>
                    {isEditMode ? 'Save Strategy' : 'Create Strategy'}
                </PrimaryButton>
            </div>
        </div>
    );
};

export default ConfigEdit;
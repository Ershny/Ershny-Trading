import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfigs } from '../../hooks/useConfigs';
import PageHeader from '../../components/PageHeader/PageHeader';
import { PrimaryButton } from '../../components/Button/Button';
import StrategyCard from '../../components/StrategyCard/StrategyCard';
import './Configs.css';

const Configs = () => {
    const navigate = useNavigate();
    const { configs, loadingConfigs, fetchConfigs, deleteConfig } = useConfigs();

    useEffect(() => {
        fetchConfigs();
    }, [fetchConfigs]);

    const handleDelete = async (id) => {
        if (window.confirm("Archer: Are you sure you want to dismantle this strategy?")) {
            const success = await deleteConfig(id);
            if (success) fetchConfigs();
        }
    };

    return (
        <div className="configs-page">
            <PageHeader variant="normal" color="accent">
                Archer Strategies
            </PageHeader>

            <div className="configs-actions">
                <PrimaryButton onClick={() => navigate('/configs/new')}>
                    + New Strategy
                </PrimaryButton>
            </div>

            {loadingConfigs ? (
                <p className="loading-text">Loading...</p>
            ) : (
                <div className="configs-grid">
                    {configs.length > 0 ? (
                        configs.map((config) => (
                            <StrategyCard
                                key={config.id || config._id}
                                config={config}
                                onEdit={(id) => navigate(`/configs/edit/${id}`)}
                                onDelete={handleDelete}
                            />
                        ))
                    ) : (
                        <div className="empty-state">
                            <p>No strategies found. Create your first sniper!</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Configs;
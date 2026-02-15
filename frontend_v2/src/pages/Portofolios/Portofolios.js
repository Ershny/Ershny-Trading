import React, { useEffect, useState } from 'react';
// Am scos useNavigate pentru că nu mai plecăm de pe pagină
import { usePortofolios } from '../../hooks/usePortofolios';
import { useConfigs } from '../../hooks/useConfigs';
import PageHeader from '../../components/PageHeader/PageHeader';
import { PrimaryButton } from '../../components/Button/Button';
import PortofolioCard from '../../components/PortofolioCard/PortofolioCard';
import PortofolioModal from '../../components/PortofolioModal/PortofolioModal';
import './Portofolios.css';

const Portofolios = () => {
    const { portofolios, loading, error, fetchPortofolios, createPortofolio } = usePortofolios();
    const { configs, fetchConfigs } = useConfigs();

    // State pentru controlul modalei
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchPortofolios();
        fetchConfigs(); // Avem nevoie de strategii pentru dropdown-ul din modală
    }, [fetchPortofolios, fetchConfigs]);

    const handleConfirmCreate = async (data) => {
        const success = await createPortofolio(data);
        if (success) {
            setIsModalOpen(false);
            fetchPortofolios(); // Reîmprospătăm lista după creare
        }
    };

    return (
        <div className="portofolios-page">
            <PageHeader variant="large" color="accent">
                Trading Portofolios
            </PageHeader>

            <div className="portofolios-actions">
                {/* Acum deschidem modala în loc de navigate */}
                <PrimaryButton onClick={() => setIsModalOpen(true)}>
                    + New Portofolio
                </PrimaryButton>
            </div>

            <div className="portofolios-list-container">
                {loading && (
                    <div className="status-msg">
                        <span className="scanner-line"></span>
                        Synchronizing fleet data...
                    </div>
                )}

                {error && (
                    <div className="status-msg error">
                        Critical Error: {error}
                    </div>
                )}

                {!loading && !error && portofolios.length === 0 && (
                    <div className="empty-state">
                        <p>No active portofolios found in the Archer network.</p>
                        <PrimaryButton inverted onClick={() => setIsModalOpen(true)}>
                            Deploy First Portofolio
                        </PrimaryButton>
                    </div>
                )}

                <div className="wide-cards-grid">
                    {portofolios.map(port => (
                        <PortofolioCard key={port._id} portofolio={port} />
                    ))}
                </div>
            </div>

            {/* Adăugăm componenta Modală */}
            <PortofolioModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleConfirmCreate}
                configs={configs}
            />
        </div>
    );
};

export default Portofolios;
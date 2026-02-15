import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { usePortofolios } from '../../hooks/usePortofolios';
import PageHeader from '../../components/PageHeader/PageHeader';
import { PrimaryButton, ErrorButton } from '../../components/Button/Button';
import PocketCarousel from '../../components/PocketCarousel/PocketCarousel';
import PocketTransactionHistory from '../../components/PocketTransactionHistory/PocketTransactionHistory';
import './PortofolioView.css';

const PortofolioView = () => {
    const { id } = useParams();
    const { fetchPortofolioById, updatePortofolio } = usePortofolios();

    const [portofolio, setPortofolio] = useState(null);
    const [selectedPocket, setSelectedPocket] = useState(null);
    const [isNameModalOpen, setIsNameModalOpen] = useState(false);

    const loadData = useCallback(async () => {
        const data = await fetchPortofolioById(id);
        if (data) {
            setPortofolio(data);
        }
    }, [id, fetchPortofolioById]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleStatusChange = async (newStatus) => {
        const success = await updatePortofolio(id, { status: newStatus });
        if (success) loadData();
    };

    if (!portofolio) return <div className="loading">Archer: Scanning unit...</div>;

    return (
        <div className="portofolio-view-container">
            <PageHeader color="accent" variant="normal">
                {portofolio.name}
            </PageHeader>

            <section className="actions-bar">
                <PrimaryButton inverted onClick={() => setIsNameModalOpen(true)}>
                    Change Name
                </PrimaryButton>

                {portofolio.status === 'Active' && (
                    <ErrorButton inverted onClick={() => handleStatusChange('Paused')}>
                        Pause Trading
                    </ErrorButton>
                )}

                {(portofolio.status === 'Paused' || portofolio.status === 'Inactive') && (
                    <PrimaryButton
                        inverted
                        disabled={portofolio.status === 'Inactive' && (!portofolio.pockets || portofolio.pockets.length === 0)}
                        onClick={() => handleStatusChange('Active')}
                    >
                        {portofolio.status === 'Paused' ? 'Resume Trading' : 'Activate Unit'}
                    </PrimaryButton>
                )}
            </section>

            <div className="view-content-split">
                {/* STÂNGA: Lista Pockets */}
                <PocketCarousel
                    portofolioId={id}
                    selectedPocketId={selectedPocket?._id}
                    onSelect={setSelectedPocket}
                />

                {/* DREAPTA: Componenta de Istoric/Detalii */}
                <div className="pocket-details-side">
                    {selectedPocket ? (
                        <div className="pocket-details-content">
                            <div className="pocket-brief">
                                <h2>{selectedPocket.name || `Pocket ${selectedPocket.currency}`}</h2>
                                <div className="brief-stats">
                                    <p>Balance: <span className="text-accent">{selectedPocket.current_funds || selectedPocket.units} {selectedPocket.currency}</span></p>
                                    <p>State: <span className={`status-pill ${selectedPocket.status.toLowerCase()}`}>{selectedPocket.status}</span></p>
                                </div>
                            </div>

                            <hr className="detail-divider" />

                            <PocketTransactionHistory pocket={selectedPocket} />
                        </div>
                    ) : (
                        <div className="empty-details">
                            <p>Select a pocket to view transaction history and performance logs.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PortofolioView;
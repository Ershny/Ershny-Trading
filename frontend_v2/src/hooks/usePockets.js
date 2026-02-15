import { useState, useCallback } from 'react';

export const usePockets = () => {
    const [pockets, setPockets] = useState([]);
    const [loadingPockets, setLoadingPockets] = useState(false);
    const [errorPockets, setErrorPockets] = useState(null);

    const API_BASE = 'http://localhost:3000/api';

    // 1. GET BY PORTOFOLIO ID
    const fetchPocketsByPortofolio = useCallback(async (portofolioId) => {
        setLoadingPockets(true);
        setErrorPockets(null);
        try {
            const response = await fetch(`${API_BASE}/pockets/byportofolio/${portofolioId}`);
            if (!response.ok) throw new Error('Archer: Failed to sync pockets for this unit.');
            const data = await response.json();
            setPockets(data);
            return data;
        } catch (err) {
            setErrorPockets(err.message);
            console.error("Pocket Sync Error:", err);
            return [];
        } finally {
            setLoadingPockets(false);
        }
    }, []);

    // 2. CREATE POCKET
    const createPocket = async (payload) => {
        try {
            const response = await fetch(`${API_BASE}/pockets`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!response.ok) throw new Error('Archer: Failed to deploy new pocket.');
            const newPocket = await response.json();

            // Actualizăm lista locală ca să se vadă imediat în UI
            setPockets(prev => [...prev, newPocket]);
            return newPocket;
        } catch (err) {
            console.error("Create Pocket Error:", err);
            return null;
        }
    };

    // 3. UPDATE POCKET (Pentru viitor: schimbare fonduri, resetare status)
    const updatePocket = async (pocketId, payload) => {
        try {
            const response = await fetch(`${API_BASE}/pockets/${pocketId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            return response.ok;
        } catch (err) {
            console.error("Update Pocket Error:", err);
            return false;
        }
    };

    return {
        pockets,
        loadingPockets,
        errorPockets,
        fetchPocketsByPortofolio,
        createPocket,
        updatePocket
    };
};
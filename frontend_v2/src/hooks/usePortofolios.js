import { useState, useCallback } from 'react';

export const usePortofolios = () => {
    const [portofolios, setPortofolios] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const API_BASE = 'http://localhost:3000/api';

    // 1. GET ALL
    const fetchPortofolios = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE}/portofolios`);
            if (!response.ok) throw new Error('Archer: Failed to sync portofolios.');
            const data = await response.json();
            setPortofolios(data);
        } catch (err) {
            setError(err.message);
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    // 2. GET SINGLE
    const fetchPortofolioById = useCallback(async (id) => {
        try {
            const response = await fetch(`${API_BASE}/portofolios/${id}`);
            if (!response.ok) throw new Error('Portofolio not found');
            return await response.json();
        } catch (err) {
            console.error(err);
            return null;
        }
    }, []);

    // 3. CREATE - REPARAT AICI (Template Literal)
    const createPortofolio = async (payload) => {
        try {
            const response = await fetch(`${API_BASE}/portofolios`, { // Folosim ` nu '
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            return response.ok;
        } catch (err) {
            console.error("Archer: Deployment failed", err);
            return false;
        }
    };

    // 4. DELETE
    const deletePortofolio = async (id) => {
        try {
            const response = await fetch(`${API_BASE}/portofolios/${id}`, {
                method: 'DELETE',
            });
            return response.ok;
        } catch (err) {
            console.error(err);
            return false;
        }
    };

    // 5. UPDATE (General - status, name, etc.)
    const updatePortofolio = async (id, payload) => {
        try {
            const response = await fetch(`${API_BASE}/portofolios/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            return response.ok;
        } catch (err) {
            console.error("Archer: Update failed", err);
            return false;
        }
    };

    return {
        portofolios,
        loading,
        error,
        fetchPortofolios,
        fetchPortofolioById,
        createPortofolio,
        deletePortofolio,
        updatePortofolio // Îl exportăm și pe acesta
    };
};
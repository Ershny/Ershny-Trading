import { useState, useCallback } from 'react';

export const useTransactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [loadingTx, setLoadingTx] = useState(false);

    const API_BASE = 'http://localhost:3000/api';

    const fetchTransactionsByPocket = useCallback(async (pocketId) => {
        if (!pocketId) return;
        setLoadingTx(true);
        try {
            const response = await fetch(`${API_BASE}/transactions/pocket/${pocketId}`);
            const data = await response.json();
            setTransactions(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
        } catch (err) {
            console.error("Archer Hook Error:", err);
        } finally {
            setLoadingTx(false);
        }
    }, []);

    return { transactions, loadingTx, fetchTransactionsByPocket };
};
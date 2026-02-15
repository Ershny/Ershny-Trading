import { useState, useCallback } from 'react';

export const useConfigs = () => {
    const [configs, setConfigs] = useState([]);
    const [loadingConfigs, setLoadingConfigs] = useState(false);
    const [configError, setConfigError] = useState(null);

    const API_BASE = 'http://localhost:3000/api';

    const fetchConfigs = useCallback(async () => {
        try {
            setLoadingConfigs(true);
            const res = await fetch(`${API_BASE}/configs/all`);
            const data = await res.json();
            setConfigs(data);
        } catch (err) {
            setConfigError(err.message);
        } finally {
            setLoadingConfigs(false);
        }
    }, []);

    const createConfig = async (newConfig) => {
        setLoadingConfigs(true);
        try {
            const res = await fetch(`${API_BASE}/configs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newConfig)
            });

            if (!res.ok) throw new Error('Server returned error');

            return true;
        } catch (err) {
            console.error("Create Config Error:", err);
            setConfigError(err.message);
            return false;
        } finally {
            setLoadingConfigs(false);
        }
    };

    const fetchConfigById = useCallback(async (id) => {
        try {
            const res = await fetch(`${API_BASE}/configs/${id}`);
            if (!res.ok) throw new Error('Could not fetch config');
            return await res.json();
        } catch (err) {
            console.error(err);
            return null;
        }
    }, []);

    const updateConfig = async (id, updatedData) => {
        try {
            const res = await fetch(`${API_BASE}/configs/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData)
            });
            return res.ok;
        } catch (err) {
            console.error("Update failed", err);
            return false;
        }
    };

    const deleteConfig = async (id) => {
        try {
            const res = await fetch(`${API_BASE}/configs/${id}`, {
                method: 'DELETE'
            });

            const data = await res.json();

            if (!res.ok) {
                // Aruncăm mesajul primit de la backend (cel cu "Mission Aborted")
                alert(data.message || "Failed to delete");
                return false;
            }

            return true;
        } catch (err) {
            console.error("Archer Delete Error:", err);
            return false;
        }
    };

    return {
        configs,
        loadingConfigs,
        configError,
        fetchConfigs,
        createConfig,
        fetchConfigById,
        updateConfig,
        deleteConfig
    };
};
import { useState, useCallback } from 'react';

export const useAssets = () => {
    const [availableAssets, setAvailableAssets] = useState([]);
    const [loadingAssets, setLoadingAssets] = useState(false);
    const [assetError, setAssetError] = useState(null);

    const API_BASE = 'http://localhost:3000/api';

    const fetchAssets = useCallback(async () => {
        try {
            setLoadingAssets(true);
            const res = await fetch(`${API_BASE}/assets`);
            if (!res.ok) throw new Error('Failed to fetch assets');
            const data = await res.json();

            // Mapăm simbolurile. Mai târziu aici poți adăuga calculele tale locale
            setAvailableAssets(data.map(a => a.symbol));
        } catch (err) {
            setAssetError(err.message);
            console.error("Asset Hook Error:", err);
        } finally {
            setLoadingAssets(false);
        }
    }, []);

    return {
        availableAssets,
        loadingAssets,
        assetError,
        fetchAssets
    };
};
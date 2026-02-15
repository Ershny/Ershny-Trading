import React, { useState, useEffect, useMemo } from 'react';
import { useTransactions } from '../../hooks/useTransactions';
import './PocketTransactionHistory.css';

const PocketTransactionHistory = ({ pocket }) => {
    const { transactions, loadingTx, fetchTransactionsByPocket } = useTransactions();
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        if (pocket?._id) fetchTransactionsByPocket(pocket._id);
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, [pocket, fetchTransactionsByPocket]);

    const tradePairs = useMemo(() => {
        return transactions
            .filter(tx => tx.transaction_type === 'BUY')
            .map(buyTx => {
                const sellTx = transactions.find(tx =>
                    tx.transaction_type === 'SELL' &&
                    String(tx._id) === String(buyTx.related_sell_id)
                );
                return { buy: buyTx, sell: sellTx };
            });
    }, [transactions]);

    // --- LOGICA PENTRU STATISTICI ---
    const stats = useMemo(() => {
        const completed = tradePairs.filter(p => p.sell);
        if (completed.length === 0) return null;

        const totalProfit = completed.reduce((sum, p) => sum + (p.sell.total_value - p.buy.total_value), 0);

        const totalDurationMs = completed.reduce((sum, p) => {
            return sum + (new Date(p.sell.date) - new Date(p.buy.date));
        }, 0);

        const last24hProfit = completed
            .filter(p => (now - new Date(p.sell.date)) <= 24 * 60 * 60 * 1000)
            .reduce((sum, p) => sum + (p.sell.total_value - p.buy.total_value), 0);

        return {
            count: completed.length,
            avgProfit: totalProfit / completed.length,
            totalProfit: totalProfit,
            avgTimeMs: totalDurationMs / completed.length,
            last24h: last24hProfit
        };
    }, [tradePairs, now]);

    const formatDuration = (startDate, endDate = null) => {
        const start = new Date(startDate);
        const end = endDate ? new Date(endDate) : now;
        const diff = Math.floor((end - start) / 1000);
        if (diff < 0) return "0s";
        const h = Math.floor(diff / 3600);
        const m = Math.floor((diff % 3600) / 60);
        const s = diff % 60;
        return `${h}h ${m}m ${s}s`;
    };

    const formatMs = (ms) => {
        const sTotal = Math.floor(ms / 1000);
        const h = Math.floor(sTotal / 3600);
        const m = Math.floor((sTotal % 3600) / 60);
        return `${h}h ${m}m`;
    };

    if (loadingTx) return <div className="tx-status">Analyzing Execution Logs...</div>;

    return (
        <div className="history-container">
            {/* SECȚIUNE STATISTICI (În loc de Header-ul vechi) */}
            {stats && (
                <div className="stats-dashboard">
                    <div className="stat-card">
                        <span className="stat-label">COMPLETED TRADES</span>
                        <span className="stat-val">{stats.count}</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-label">AVG TIME / TRADE</span>
                        <span className="stat-val">{formatMs(stats.avgTimeMs)}</span>
                    </div>
                    <div className="stat-card highlighted">
                        <span className="stat-label">TOTAL PROFIT</span>
                        <span className={`stat-val ${stats.totalProfit >= 0 ? 'plus' : 'minus'}`}>
                            {stats.totalProfit.toFixed(2)} <small>USDC</small>
                        </span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-label">LAST 24H</span>
                        <span className={`stat-val ${stats.last24h >= 0 ? 'plus' : 'minus'}`}>
                            {stats.last24h >= 0 ? '+' : ''}{stats.last24h.toFixed(2)}
                        </span>
                    </div>
                </div>
            )}

            <div className="trade-pairs-list">
                {tradePairs.map(({ buy, sell }) => {
                    const isLive = !sell;
                    const profitSum = sell ? (sell.total_value - buy.total_value) : 0;

                    return (
                        <div key={buy._id} className={`trade-pair-card ${isLive ? 'live' : 'closed'}`}>
                            <div className="col-info">
                                <span className="label">Units</span>
                                <span className="val">{buy.units.toFixed(6)}</span>
                                <span className="label">Currency</span>
                                <span className="val-asset">{buy.currency}</span>
                            </div>

                            <div className="col-execution">
                                <div className="exec-row buy">
                                    <span className="badge-buy">BUY</span>
                                    <div className="exec-data">
                                        <span className="price">@ {buy.price_per_unit.toLocaleString()}</span>
                                        <span className="date">{new Date(buy.date).toLocaleString()}</span>
                                    </div>
                                </div>
                                {sell ? (
                                    <div className="exec-row sell">
                                        <span className="badge-sell">SELL</span>
                                        <div className="exec-data">
                                            <span className="price">@ {sell.price_per_unit.toLocaleString()}</span>
                                            <span className="date">{new Date(sell.date).toLocaleString()}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="exec-row pending">
                                        <div className="open-position-tag">OPEN POSITION</div>
                                    </div>
                                )}
                            </div>

                            <div className="col-performance">
                                <div className="perf-metric">
                                    <span className="label">DURATION</span>
                                    <span className={`timer ${isLive ? 'active' : ''}`}>
                                        {formatDuration(buy.date, sell?.date)}
                                    </span>
                                </div>
                                {!isLive ? (
                                    <div className="perf-metric">
                                        <span className="label">PROFIT BRUT</span>
                                        <span className={`value ${profitSum >= 0 ? 'plus' : 'minus'}`}>
                                            {profitSum >= 0 ? '+' : ''}{profitSum.toFixed(2)} USDC
                                        </span>
                                    </div>
                                ) : (
                                    <div className="live-status">
                                        <div className="pulse"></div>
                                        <span>LIVE TRACKING</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PocketTransactionHistory;
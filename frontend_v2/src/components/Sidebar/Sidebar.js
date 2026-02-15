import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
    return (
        <aside className="sidebar">
            <div className="logo">
                <span className="logoName">ARCHER<span>TRADING</span></span>
                <span className="logoMoto">PRECISION ALGORITHMS</span>
            </div>

            <nav className="sidebar-nav">
                <NavLink to="/" className="nav-link" end>
                    <span>📊 Dashboard</span>
                </NavLink>

                <NavLink to="/configs" className="nav-link">
                    <span>⚙️ Strategy Templates</span>
                </NavLink>

                <NavLink to="/portfolios" className="nav-link">
                    <span>📁 Portfolios</span>
                </NavLink>

                <NavLink to="/watchlist" className="nav-link">
                    <span>🔭 Market Watch</span>
                </NavLink>

                <NavLink to="/history" className="nav-link">
                    <span>📜 History</span>
                </NavLink>
            </nav>
        </aside>
    );
};

export default Sidebar;
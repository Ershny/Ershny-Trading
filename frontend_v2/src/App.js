import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar/Sidebar';
import Configs from './pages/Configs/Configs';
import ConfigEdit from './pages/Configs/ConfigEdit';
import Portofolios from "./pages/Portofolios/Portofolios";
import PortofolioView from "./pages/Portofolios/PortofolioView";
import './App.css';

// Placeholders temporare pentru pagini ca să nu dea eroare la import
const Dashboard = () => (
    <div className="page-header">
      <h1>Welcome, Archer</h1>
      <p>Operational overview and performance metrics.</p>
    </div>
);

const Watchlist = () => (
    <div className="page-header">
      <h1>Market Watch</h1>
      <p>Real-time USDC pairs monitoring.</p>
    </div>
);

const History = () => (
    <div className="page-header">
      <h1>Trade History</h1>
      <p>Detailed log of completed transactions.</p>
    </div>
);

function App() {
  return (
      <Router>
        <div className="app-container">
          <Sidebar />
          <main className="main-content">
            <div className="content-wrapper">
              <Routes>
                  <Route path="/" element={<Dashboard/>}/>
                  <Route path="/configs" element={<Configs/>}/>
                  <Route path="/configs/new" element={<ConfigEdit />} />
                  <Route path="/configs/edit/:id" element={<ConfigEdit />} />
                  <Route path="/portfolios" element={<Portofolios/>}/>
                  <Route path="/portofolios/:id" element={<PortofolioView/>}/>
                  <Route path="/watchlist" element={<Watchlist/>}/>
                  <Route path="/history" element={<History/>}/>
              </Routes>
            </div>
          </main>
        </div>
      </Router>
  );
}

export default App;
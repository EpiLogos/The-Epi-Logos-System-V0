import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SubsystemsPage } from './components/pages/SubsystemsPage';
import { ParamasivaPage } from './components/pages/ParamasivaPage';
import { EpiLogosPage } from './components/pages/EpiLogosPage';
import { QuaternalLogicPage } from './components/pages/QuaternalLogicPage';
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/paramasiva" replace />} />
        <Route path="/subsystems" element={<SubsystemsPage />} />
        <Route path="/paramasiva" element={<ParamasivaPage />} />
        <Route path="/epi-logos" element={<EpiLogosPage />} />
        <Route path="/quaternal-logic" element={<QuaternalLogicPage />} />
      </Routes>
    </Router>
  );
}

export default App
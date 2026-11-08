import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import App from './App';
import { HomePage } from './HomePage';
import { Play3DPage } from './play3d/Play3DPage';
import { VisualLabPage } from './visual-lab/VisualLabPage';
import { GamePage } from './game/GamePage';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/classic" element={<App />} />
        <Route path="/play-3d" element={<Play3DPage />} />
        <Route path="/visual-lab" element={<VisualLabPage />} />
        <Route path="/game" element={<GamePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>,
);

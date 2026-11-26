
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Calender from './components/Calender';
import Login from './pages/Login';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/mainpage" element={<main className="main-container"><Calender /></main>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

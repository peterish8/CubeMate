import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { LandingPage } from "./components/LandingPage";
import { RoomPage } from "./components/RoomPage";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/room/:roomCode" element={<RoomPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

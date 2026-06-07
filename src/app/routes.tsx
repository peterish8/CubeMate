import { Navigate, Route, Routes } from "react-router-dom";
import { LandingPage } from "../features/landing/LandingPage";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { PracticePage } from "../features/practice/PracticePage";
import { RoomPage } from "../features/room/RoomPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/practice" element={<PracticePage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/room/:roomCode" element={<RoomPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
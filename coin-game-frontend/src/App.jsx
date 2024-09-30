import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Header from "./components/shared/Header";
import Footer from "./components/shared/Footer";
import Home from "@/pages/Home";
import WaitingRoom from "@/pages/WaitingRoom";
import Scoreboard from "@/pages/Scoreboard";
import Login from "@/pages/Login";
import Rules from "@/pages/Rules";
import AboutTheGame from "@/pages/AboutTheGame";
import ManageAccount from "@/pages/ManageAccount";
import { Toaster } from "sonner";
import AppProvider from "./context/AppContext";
import Game from "./pages/Game";
import GameVsAI from "./pages/GameVsAI";
import ProtectedRoute from "./components/shared/ProtectedRoute";

export default function App() {
  return (
    <Router>
      <AppProvider>
        <div className="flex flex-col min-h-screen">
          <Toaster />
          <Header />
          <main className="flex-grow container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route
                path="/manage-account"
                element={
                  <ProtectedRoute>
                    <ManageAccount />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/waiting-room"
                element={
                  <ProtectedRoute>
                    <WaitingRoom />
                  </ProtectedRoute>
                }
              />
              <Route path="/scoreboard" element={<Scoreboard />} />
              <Route path="/rules" element={<Rules />} />
              <Route path="/about" element={<AboutTheGame />} />
              <Route
                path="/game/:gameId"
                element={
                  <ProtectedRoute>
                    <Game />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/game-vs-ai"
                element={
                  <ProtectedRoute>
                    <GameVsAI />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
          <Footer />
        </div>
      </AppProvider>
    </Router>
  );
}

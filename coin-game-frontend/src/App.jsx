import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Header from "./components/shared/Header";
import Footer from "./components/shared/Footer";
import Home from "@/pages/Home";
// import Game from "./pages/Game";
import WaitingRoom from "@/pages/WaitingRoom";
import Scoreboard from "@/pages/Scoreboard";
import Login from "@/pages/Login";
import Rules from "@/pages/Rules";
import { Toaster } from "sonner";
import AppProvider from "./context/AppContext";
import { useEffect } from "react";
import { initSocket } from "./lib/socket";
import Game from "./pages/Game";
import ProtectedRoute from "./components/shared/ProtectedRoute";

export default function App() {
  useEffect(() => {
    initSocket();
  }, []);

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
                path="/waiting-room"
                element={
                  <ProtectedRoute>
                    <WaitingRoom />
                  </ProtectedRoute>
                }
              />
              <Route path="/scoreboard" element={<Scoreboard />} />
              <Route path="/rules" element={<Rules />} />
              <Route
                path="/game/:gameId"
                element={
                  <ProtectedRoute>
                    <Game />
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

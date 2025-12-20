import { useState } from "react";
import "./App.css";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import YourFarms from "./components/YourFarms";
import AddFarm from "./components/AddFarm";
import CattleList from "./components/CattleList";
import AddCattle from "./components/AddCattle";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = localStorage.getItem("token");
    return !!token;
  });

  const [authMode, setAuthMode] = useState("login"); // 'login' | 'register'
  const [view, setView] = useState("dashboard"); // 'dashboard' | 'farms' | 'addFarm' | 'cattle' | 'addCattle'
  const [selectedFarm, setSelectedFarm] = useState(null);

  if (!isAuthenticated) {
    if (authMode === "register") {
      return (
        <Register
          onRegisterSuccess={() => setIsAuthenticated(true)}
          onSwitchToLogin={() => setAuthMode("login")}
        />
      );
    }

    return (
      <Login
        onLoginSuccess={() => setIsAuthenticated(true)}
        onSwitchToRegister={() => setAuthMode("register")}
      />
    );
  }

  if (view === "farms") {
    return (
      <YourFarms
        onSelectFarm={(farm) => {
          setSelectedFarm(farm);
          setView("cattle");
        }}
        onAddFarm={() => setView("addFarm")}
        onBack={() => setView("dashboard")}
      />
    );
  }

  if (view === "addFarm") {
    return (
      <AddFarm
        onBack={() => setView("farms")}
        onCreated={(farm) => {
          setSelectedFarm(farm);
          setView("farms");
        }}
      />
    );
  }

  if (view === "cattle") {
    return (
      <CattleList
        farm={selectedFarm}
        onBack={() => setView("dashboard")}
        onAddCattle={() => setView("addCattle")}
      />
    );
  }

  if (view === "addCattle") {
    return (
      <AddCattle
        farm={selectedFarm}
        onBack={() => setView("cattle")}
        onCreated={() => setView("cattle")}
      />
    );
  }

  return (
    <Dashboard
      selectedFarm={selectedFarm}
      onGoToFarms={() => setView("farms")}
      onGoToCattle={() => setView("cattle")}
    />
  );
}

export default App;

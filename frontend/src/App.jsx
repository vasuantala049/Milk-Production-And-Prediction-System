import { useState } from "react";
import "./App.css";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
// import YourFarms from "./components/YourFarms";
// import AddFarm from "./components/AddFarm";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = localStorage.getItem("token");
    return !!token;
  });

  const [authMode, setAuthMode] = useState("login"); // 'login' | 'register'

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

  // After login you can decide what to render: Dashboard, YourFarms, etc.
  return <Dashboard />;
}

export default App;

import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import YourFarms from "./components/YourFarms";
import AddFarm from "./components/AddFarm";
import CattleList from "./components/CattleList";
import AddCattle from "./components/AddCattle";
import ProtectedRoute from "./components/ProtectedRoute";
import AddMilk from "./components/AddMilk";
import "./App.css";


function App() {
  const isAuthenticated = !!localStorage.getItem("token");

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/farms" element={<YourFarms />} />
        <Route path="/farms/add" element={<AddFarm />} />

        {/* IMPORTANT: more specific route FIRST */}
        <Route path="/cattle/add/:farmId" element={<AddCattle />} />
        <Route path="/cattle/:farmId" element={<CattleList />} />
        <Route path="/milk/add/:farmId" element={<AddMilk />} />

      </Route>

      {/* Fallback */}
      <Route
        path="*"
        element={
          <Navigate
            to={isAuthenticated ? "/dashboard" : "/login"}
            replace
          />
        }
      />
    </Routes>
  );
}

export default App;

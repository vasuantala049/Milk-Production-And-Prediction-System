import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import YourFarms from "./components/YourFarms";
import AddFarm from "./components/AddFarm";
import EditFarm from "./components/EditFarm";
import Profile from "./components/Profile";
import AddWorker from "./components/AddWorker";
import CattleList from "./components/CattleList";
import AddCattle from "./components/AddCattle";
import EditCattle from "./components/EditCattle";
import WorkersList from "./components/WorkersList";
import ShadePage from "./components/dashboard/ShadePage";
import ProtectedRoute from "./components/ProtectedRoute";
import AddMilk from "./components/AddMilk";
import BuyMilk from "./components/BuyMilk";
import PendingOrders from "./components/PendingOrders";
import MyOrders from "./components/MyOrders";
import OrdersPage from "./components/OrdersPage";
import SubscriptionsPage from "./components/SubscriptionsPage";
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
        <Route path="/edit-farm/:farmId" element={<EditFarm />} />
        <Route path="/farms" element={<YourFarms />} />
        <Route path="/farms/add" element={<AddFarm />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/farms/:farmId/add-worker" element={<AddWorker />} />

        {/* IMPORTANT: more specific route FIRST */}
        <Route path="/cattle/add/:farmId" element={<AddCattle />} />
        <Route path="/cattle/edit/:farmId/:cattleId" element={<EditCattle />} />
        <Route path="/cattle/:farmId" element={<CattleList />} />
        <Route path="/workers/:farmId" element={<WorkersList />} />
        <Route path="/farms/:farmId/sheds" element={<ShadePage />} />
        <Route path="/milk/add/:farmId" element={<AddMilk />} />
        <Route path="/buy-milk" element={<BuyMilk />} />
        <Route path="/farms/:farmId/pending-orders" element={<PendingOrders />} />
        <Route path="/farms/:farmId/orders" element={<OrdersPage />} />
        <Route path="/farms/:farmId/subscriptions" element={<SubscriptionsPage />} />
        <Route path="/my-orders" element={<MyOrders />} />

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

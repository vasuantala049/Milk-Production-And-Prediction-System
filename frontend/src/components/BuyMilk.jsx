import React, { useState } from "react";
import { apiFetch } from "../api/client";

export default function BuyMilk() {
  const [quantity, setQuantity] = useState("");
  const [session, setSession] = useState("MORNING");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [farmId, setFarmId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      const payload = {
        quantity: parseFloat(quantity),
        session,
        date,
        farmId: parseInt(farmId, 10)
      };

      const order = await apiFetch("/BuyMilk", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      setMessage({ type: "success", text: `Order created (id: ${order.id})` });
      setQuantity("");
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Request failed" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 520, margin: "24px auto", padding: 16 }}>
      <h2>Buy Milk</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label>Farm ID</label>
          <input
            type="number"
            value={farmId}
            onChange={(e) => setFarmId(e.target.value)}
            required
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Quantity (liters)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Session</label>
          <select
            value={session}
            onChange={(e) => setSession(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          >
            <option value="MORNING">MORNING</option>
            <option value="EVENING">EVENING</option>
          </select>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        <div>
          <button type="submit" disabled={loading} style={{ padding: "8px 16px" }}>
            {loading ? "Buying..." : "Buy Milk"}
          </button>
        </div>
      </form>

      {message && (
        <div style={{ marginTop: 12, color: message.type === "error" ? "red" : "green" }}>
          {message.text}
        </div>
      )}
    </div>
  );
}


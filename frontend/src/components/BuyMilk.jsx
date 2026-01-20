import React, { useState } from "react";
import { apiFetch } from "../api/client";

import { useSearchParams } from "react-router-dom";

export default function BuyMilk() {
  const [searchParams] = useSearchParams();
  const [quantity, setQuantity] = useState("");
  const [session, setSession] = useState("MORNING");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [farmId, setFarmId] = useState(searchParams.get("farm") || "");
  const [farmName, setFarmName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [isSubscription, setIsSubscription] = useState(false);

  React.useEffect(() => {
    if (farmId) {
      apiFetch(`/farms/${farmId}`).then(data => {
        setFarmName(data.name);
      }).catch(() => setFarmName("Unknown Farm"));
    }
  }, [farmId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      if (isSubscription) {
        const payload = {
          farmId: parseInt(farmId, 10),
          quantity: parseFloat(quantity),
          session,
          startDate: date
        };
        const sub = await apiFetch("/subscriptions", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        setMessage({ type: "success", text: `Subscription created (id: ${sub.id})` });
      } else {
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
      }
      setQuantity("");
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Request failed" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 520, margin: "24px auto", padding: 16 }}>
      <h2>{isSubscription ? "Subscribe to Milk" : "Buy Milk"}</h2>

      {farmName && <h3 style={{ color: '#666', marginTop: 0 }}>from {farmName}</h3>}

      <div style={{ marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => setIsSubscription(false)}
          style={{
            padding: "8px 16px",
            marginRight: 8,
            backgroundColor: !isSubscription ? "#007bff" : "#ccc",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: "pointer"
          }}
        >
          One-time Buy
        </button>
        <button
          type="button"
          onClick={() => setIsSubscription(true)}
          style={{
            padding: "8px 16px",
            backgroundColor: isSubscription ? "#007bff" : "#ccc",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: "pointer"
          }}
        >
          Subscribe
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {!farmId && (
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
        )}

        <div style={{ marginBottom: 12 }}>
          <label>Quantity (liters){isSubscription && " / day"}</label>
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
          <label>When to receive milk</label>
          <select
            value={session}
            onChange={(e) => setSession(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          >
            <option value="MORNING">Morning (6 AM - 10 AM)</option>
            <option value="EVENING">Evening (4 PM - 8 PM)</option>
          </select>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>{isSubscription ? "Start Date" : "Date"}</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        <div>
          <button type="submit" disabled={loading} style={{ padding: "8px 16px", cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Processing..." : (isSubscription ? "Subscribe" : "Buy Milk")}
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


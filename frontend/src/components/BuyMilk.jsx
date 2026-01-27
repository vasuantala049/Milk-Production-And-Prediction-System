import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { apiFetch } from "../api/client";
import { subscriptionApi } from "../api/subscriptionApi";
import { orderApi } from "../api/orderApi";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export default function BuyMilk() {
  const [searchParams] = useSearchParams();
  const [quantity, setQuantity] = useState("");
  const [session, setSession] = useState("MORNING");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [farmId, setFarmId] = useState(searchParams.get("farm") || "");
  const [farm, setFarm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [isSubscription, setIsSubscription] = useState(false);

  useEffect(() => {
    if (!farmId) {
      setFarm(null);
      return;
    }
    apiFetch(`/farms/${farmId}`)
      .then((data) => {
        setFarm(data);
      })
      .catch(() => setFarm(null));
  }, [farmId]);

  const parsedQuantity = parseFloat(quantity) || 0;
  const pricePerLiter = farm?.pricePerLiter || 0;
  const estimatedTotal = parsedQuantity > 0 ? parsedQuantity * pricePerLiter : null;

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      const parsedFarmId = parseInt(farmId, 10);
      const parsedQty = parseFloat(quantity);

      if (!parsedFarmId || Number.isNaN(parsedFarmId)) {
        throw new Error("Please select a valid farm.");
      }
      if (!parsedQty || Number.isNaN(parsedQty) || parsedQty <= 0) {
        throw new Error("Quantity must be greater than 0.");
      }
      if (new Date(date) < new Date(new Date().toISOString().slice(0, 10))) {
        throw new Error("Date cannot be in the past.");
      }

      if (isSubscription) {
        const payload = {
          farmId: parsedFarmId,
          quantity: parsedQty,
          session,
          startDate: date,
        };
        const sub = await subscriptionApi.createSubscription(payload);
        setMessage({ type: "success", text: `Subscription created (id: ${sub.id})` });
      } else {
        const payload = {
          farmId: parsedFarmId,
          quantity: parsedQty,
          session,
          date,
        };

        const order = await orderApi.createOrder(payload);
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
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-xl shadow-lg border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{isSubscription ? "Milk Subscription" : "Buy Fresh Milk"}</CardTitle>
              <CardDescription>
                {farm
                  ? `From ${farm.name}${farm.city ? ` • ${farm.city}` : ""}`
                  : "Choose a farm and quantity to continue."}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={isSubscription ? "outline" : "default"}
                size="sm"
                onClick={() => setIsSubscription(false)}
              >
                One-time
              </Button>
              <Button
                type="button"
                variant={isSubscription ? "default" : "outline"}
                size="sm"
                onClick={() => setIsSubscription(true)}
              >
                Subscribe
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            {!farmId && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Farm ID</label>
                <Input
                  type="number"
                  value={farmId}
                  onChange={(e) => setFarmId(e.target.value)}
                  placeholder="Enter farm ID from farms list"
                  required
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">
                  Quantity (liters){isSubscription && " / day"}
                </label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Session</label>
                <select
                  value={session}
                  onChange={(e) => setSession(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="MORNING">Morning (6 AM - 10 AM)</option>
                  <option value="EVENING">Evening (4 PM - 8 PM)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">
                {isSubscription ? "Start date" : "Delivery date"}
              </label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="mt-2 text-sm text-muted-foreground space-y-1">
              {farm && (
                <p>
                  Price: <span className="font-medium">₹{pricePerLiter.toFixed(2)}</span> per liter
                </p>
              )}
              {estimatedTotal !== null && farm && (
                <p>
                  Estimated {isSubscription ? "daily" : "order"} total:{" "}
                  <span className="font-semibold">₹{estimatedTotal.toFixed(2)}</span>
                </p>
              )}
            </div>

            <CardFooter className="px-0 pb-0 flex-col items-stretch gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? "Processing..." : isSubscription ? "Start subscription" : "Place order"}
              </Button>

              {message && (
                <div
                  className={`text-sm rounded-md px-3 py-2 ${
                    message.type === "error"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {message.text}
                </div>
              )}
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


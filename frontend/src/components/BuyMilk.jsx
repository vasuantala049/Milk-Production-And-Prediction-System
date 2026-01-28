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
  const [session, setSession] = useState("MORNING"); // Internal session state
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(""); // For one-time buy UI
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [farmId, setFarmId] = useState(searchParams.get("farm") || "");
  const [farm, setFarm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [isSubscription, setIsSubscription] = useState(false);
  const [availableQty, setAvailableQty] = useState(null);

  // Load farm details
  useEffect(() => {
    if (!farmId) {
      setFarm(null);
      return;
    }
    apiFetch(`/farms/${farmId}`)
      .then((data) => setFarm(data))
      .catch(() => setFarm(null));
  }, [farmId]);

  // Check Availability
  useEffect(() => {
    if (farmId && date && session) {
      apiFetch(`/milk/availability?farmId=${farmId}&date=${date}&session=${session}`)
        .then((data) => setAvailableQty(data.availableMilk))
        .catch(() => setAvailableQty(null));
    }
  }, [farmId, date, session]);

  // Generate Time Slots for One-time Buy
  const timeSlots = React.useMemo(() => {
    if (isSubscription) return [];

    const slots = [];
    const now = new Date();
    const isToday = date === now.toISOString().slice(0, 10);
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Helper to create slot objects
    const addSlot = (hour, minute, sessionType) => {
      // Logic to filter past slots if today
      if (isToday) {
        if (hour < currentHour) return;
        if (hour === currentHour && minute <= currentMinute) return;
      }

      const timeLabel = new Date(0, 0, 0, hour, minute).toLocaleTimeString([], {
        hour: 'numeric', minute: '2-digit', hour12: true
      });

      slots.push({
        value: `${hour}:${minute === 0 ? "00" : minute}`,
        label: timeLabel,
        session: sessionType
      });
    };

    // Morning Slots (6 AM to 12 PM) - 30 min intervals
    for (let h = 6; h < 12; h++) {
      addSlot(h, 0, "MORNING");
      addSlot(h, 30, "MORNING");
    }
    // Add 12:00 PM as last morning slot? 
    // "to 12 pm from the current time" -> usually implies upto 12. Let's include 12:00 PM as boundary if needed, 
    // but typical morning session ends around noon. Let's add 12:00 PM.
    addSlot(12, 0, "MORNING");

    // Evening Slots (4 PM to 8 PM)
    for (let h = 16; h < 20; h++) {
      addSlot(h, 0, "EVENING");
      addSlot(h, 30, "EVENING");
    }
    // Add 8:00 PM boundary
    addSlot(20, 0, "EVENING");

    return slots;
  }, [date, isSubscription]);


  const parsedQuantity = parseFloat(quantity) || 0;
  const pricePerLiter = farm?.pricePerLiter || 0;
  const estimatedTotal = parsedQuantity > 0 ? parsedQuantity * pricePerLiter : null;

  // Subscription Time Restrictions Logic
  const isToday = date === new Date().toISOString().slice(0, 10);
  const currentHour = new Date().getHours();
  const isMorningDisabled = isToday && currentHour >= 10;
  const isEveningDisabled = isToday && currentHour >= 20;

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      if (!isSubscription && !selectedTimeSlot) {
        throw new Error("Please select a time slot.");
      }

      const parsedFarmId = parseInt(farmId, 10);
      const parsedQty = parseFloat(quantity);

      if (!parsedFarmId || Number.isNaN(parsedFarmId)) throw new Error("Please select a valid farm.");
      if (!parsedQty || Number.isNaN(parsedQty) || parsedQty <= 0) throw new Error("Quantity must be greater than 0.");

      const todayStr = new Date().toISOString().slice(0, 10);
      if (date < todayStr) throw new Error("Date cannot be in the past.");

      // Check available quantity
      if (availableQty !== null && parsedQty > availableQty) {
        throw new Error(`Insufficient milk available. Only ${availableQty.toFixed(1)}L remaining.`);
      }

      if (isSubscription) {
        const payload = {
          farmId: parsedFarmId,
          quantity: parsedQty,
          session,
          startDate: date,
        };
        const sub = await subscriptionApi.createSubscription(payload);
        setMessage({ type: "success", text: `Subscription created successfully! (ID: ${sub.id})` });
      } else {
        const payload = {
          farmId: parsedFarmId,
          quantity: parsedQty,
          session, // Session is updated when time slot changes
          date,
        };

        const order = await orderApi.createOrder(payload);
        setMessage({
          type: "success",
          text: `Order sent for approval! Owner will review. (ID: ${order.id})`
        });
      }
      setQuantity("");
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Request failed" });
    } finally {
      setLoading(false);
    }
  }

  // Handle time slot change for one-time buy
  const handleTimeSlotChange = (e) => {
    const val = e.target.value;
    setSelectedTimeSlot(val);

    // Find session for this slot
    const slot = timeSlots.find(s => s.value === val);
    if (slot) {
      setSession(slot.session);
    }
  };

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
                  : "Choose a farm and quantity."}
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
                  placeholder="Enter farm ID"
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
                {availableQty !== null && (
                  <p className={`text-xs ${availableQty > 0 ? "text-emerald-600" : "text-destructive"}`}>
                    Available: {availableQty.toFixed(1)} Liters
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">
                  {isSubscription ? "Session" : "Time Slot"}
                </label>

                {isSubscription ? (
                  // Subscription Session Select
                  <>
                    <select
                      value={session}
                      onChange={(e) => setSession(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="MORNING" disabled={isMorningDisabled}>
                        Morning (6 AM - 10 AM){isMorningDisabled ? " - Unavailable" : ""}
                      </option>
                      <option value="EVENING" disabled={isEveningDisabled}>
                        Evening (4 PM - 8 PM){isEveningDisabled ? " - Unavailable" : ""}
                      </option>
                    </select>
                    {(isMorningDisabled && session === "MORNING") || (isEveningDisabled && session === "EVENING") ? (
                      <p className="text-xs text-amber-600">
                        ⚠️ This slot cannot be selected after cutoff time.
                      </p>
                    ) : null}
                  </>
                ) : (
                  // One-time Buy Time Slot Select
                  <select
                    value={selectedTimeSlot}
                    onChange={handleTimeSlotChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Select a time...</option>
                    {timeSlots.length > 0 ? (
                      timeSlots.map((slot) => (
                        <option key={slot.value} value={slot.value}>
                          {slot.label}
                        </option>
                      ))
                    ) : (
                      <option disabled>No slots available for today</option>
                    )}
                  </select>
                )}
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
                <p>Price: <span className="font-medium">₹{pricePerLiter.toFixed(2)}</span> / L</p>
              )}
              {estimatedTotal !== null && (
                <p>Total: <span className="font-semibold">₹{estimatedTotal.toFixed(2)}</span></p>
              )}
            </div>

            <CardFooter className="px-0 pb-0 flex-col items-stretch gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? "Processing..." : isSubscription ? "Start subscription" : "Place order"}
              </Button>

              {message && (
                <div className={`text-sm rounded-md px-3 py-2 ${message.type === "error" ? "bg-destructive/10 text-destructive" : "bg-emerald-50 text-emerald-700"
                  }`}>
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


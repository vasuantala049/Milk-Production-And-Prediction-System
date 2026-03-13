import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../api/client";
import { subscriptionApi } from "../api/subscriptionApi";
import { orderApi } from "../api/orderApi";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export default function BuyMilk() {
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const [quantity, setQuantity] = useState("");
  const [session, setSession] = useState("MORNING");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [farmId, setFarmId] = useState(searchParams.get("farm") || "");
  const [farm, setFarm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [isSubscription, setIsSubscription] = useState(false);
  const [animalType, setAnimalType] = useState("ANY");

  useEffect(() => {
    if (!farmId) { setFarm(null); return; }
    apiFetch(`/farms/${farmId}`)
      .then((data) => setFarm(data))
      .catch(() => setFarm(null));
  }, [farmId]);

  const timeSlots = React.useMemo(() => {
    if (isSubscription) return [];

    const slots = [];
    const now = new Date();
    const hasPartialHour = now.getMinutes() > 0 && now.getMinutes() <= 30;
    const startMinute = hasPartialHour ? 30 : 0;
    const startHour = now.getMinutes() > 30 ? now.getHours() + 1 : now.getHours();

    const addSlot = (hour, minute) => {
      const label = new Date(0, 0, 0, hour, minute).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      slots.push({
        value: `${hour}:${minute === 0 ? "00" : minute}`,
        label,
        session: hour < 14 ? "MORNING" : "EVENING",
      });
    };

    for (let hour = startHour; hour <= 23; hour++) {
      if (hour === startHour && startMinute === 30) {
        addSlot(hour, 30);
        continue;
      }

      addSlot(hour, 0);
      if (hour !== 23) {
        addSlot(hour, 30);
      }
    }

    return slots;
  }, [isSubscription]);

  useEffect(() => {
    if (isSubscription) {
      setSelectedTimeSlot("");
      return;
    }

    if (timeSlots.length === 0) {
      setSelectedTimeSlot("");
      return;
    }

    setSelectedTimeSlot((current) => {
      if (current && timeSlots.some((slot) => slot.value === current)) {
        return current;
      }

      const firstSlot = timeSlots[0];
      setSession(firstSlot.session);
      return firstSlot.value;
    });
  }, [isSubscription, timeSlots]);

  const parsedQuantity = parseFloat(quantity) || 0;

  const getPricePerLiter = () => {
    if (!farm) return 0;
    if (animalType === "COW" && farm.cowPrice) return farm.cowPrice;
    if (animalType === "BUFFALO" && farm.buffaloPrice) return farm.buffaloPrice;
    if (animalType === "SHEEP" && farm.sheepPrice) return farm.sheepPrice;
    if (animalType === "GOAT" && farm.goatPrice) return farm.goatPrice;
    return farm.pricePerLiter || 0;
  };

  const pricePerLiter = getPricePerLiter();
  const estimatedTotal = parsedQuantity > 0 ? parsedQuantity * pricePerLiter : null;

  const isToday = date === new Date().toISOString().slice(0, 10);
  const currentHour = new Date().getHours();
  const isMorningDisabled = isToday && currentHour >= 10;
  const isEveningDisabled = isToday && currentHour >= 20;

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      if (!isSubscription && !selectedTimeSlot) throw new Error(t('buyMilk.selectTimeSlot'));

      const parsedFarmId = parseInt(farmId, 10);
      const parsedQty = parseFloat(quantity);

      if (!parsedFarmId || Number.isNaN(parsedFarmId)) throw new Error(t('buyMilk.selectValidFarm'));
      if (!parsedQty || Number.isNaN(parsedQty) || parsedQty <= 0) throw new Error(t('buyMilk.quantityPositive'));
      if (parsedQty !== 0.5 && (parsedQty < 1 || Math.round(parsedQty * 2) !== parsedQty * 2)) {
        throw new Error(t('buyMilk.quantityFormat'));
      }

      const todayStr = new Date().toISOString().slice(0, 10);
      const finalDate = isSubscription ? date : todayStr;

      if (isSubscription && finalDate < todayStr) throw new Error(t('buyMilk.startDatePast'));
      if (isSubscription && (!currentUser?.address || !currentUser?.city)) {
        throw new Error(t('buyMilk.completeBuyerProfile'));
      }

      if (isSubscription) {
        const payload = { farmId: parsedFarmId, quantity: parsedQty, session, animalType, startDate: date };
        const sub = await subscriptionApi.createSubscription(payload);
        setMessage({ type: "success", text: t('buyMilk.subscriptionSent', { id: sub.displayCode || String(sub.id).padStart(6, '0') }) });
      } else {
        const payload = { farmId: parsedFarmId, quantity: parsedQty, session, animalType, date };
        const order = await orderApi.createOrder(payload);
        setMessage({ type: "success", text: t('buyMilk.orderSent', { id: order.displayCode || String(order.id).padStart(6, '0') }) });
      }
      setQuantity("");
    } catch (err) {
      setMessage({ type: "error", text: err.message || t('buyMilk.requestFailed') });
    } finally {
      setLoading(false);
    }
  }

  const handleTimeSlotChange = (e) => {
    const nextSlot = e.target.value;
    setSelectedTimeSlot(nextSlot);
    const matchedSlot = timeSlots.find((slot) => slot.value === nextSlot);
    if (matchedSlot) {
      setSession(matchedSlot.session);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-xl shadow-lg border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{isSubscription ? t('buyMilk.milkSubscription') : t('buyMilk.buyFreshMilk')}</CardTitle>
              <CardDescription>
                {farm
                  ? t('buyMilk.fromFarm', { name: farm.name }) + (farm.city ? ` • ${farm.city}` : "")
                  : t('buyMilk.chooseFarmAndQty')}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant={isSubscription ? "outline" : "default"} size="sm" onClick={() => setIsSubscription(false)}>
                {t('buyMilk.oneTime')}
              </Button>
              <Button type="button" variant={isSubscription ? "default" : "outline"} size="sm" onClick={() => setIsSubscription(true)}>
                {t('buyMilk.subscribe')}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            {!farmId && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">{t('buyMilk.farmIdLabel')}</label>
                <Input type="number" value={farmId} onChange={(e) => setFarmId(e.target.value)} placeholder={t('buyMilk.enterFarmId')} required />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">{t('buyMilk.animalType')}</label>
                <select value={animalType} onChange={(e) => setAnimalType(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="ANY">{t('buyMilk.any')}</option>
                  <option value="COW">{t('buyMilk.cowMilk')}</option>
                  <option value="BUFFALO">{t('buyMilk.buffaloMilk')}</option>
                  <option value="SHEEP">{t('buyMilk.sheepMilk')}</option>
                  <option value="GOAT">{t('buyMilk.goatMilk')}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">
                  {t('buyMilk.quantityLiters')}{isSubscription && ` / ${t('buyMilk.quantityPerDay').split('/')[1]?.trim() || 'day'}`}
                </label>
                <Input type="number" step="0.1" min="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">
                  {isSubscription ? t('buyMilk.session') : t('buyMilk.timeSlot')}
                </label>

                {isSubscription ? (
                  <>
                    <select value={session} onChange={(e) => setSession(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="MORNING" disabled={isMorningDisabled}>
                        {t('buyMilk.morningSession')}{isMorningDisabled ? ` - ${t('buyMilk.unavailable')}` : ""}
                      </option>
                      <option value="EVENING" disabled={isEveningDisabled}>
                        {t('buyMilk.eveningSession')}{isEveningDisabled ? ` - ${t('buyMilk.unavailable')}` : ""}
                      </option>
                    </select>
                    {(isMorningDisabled && session === "MORNING") || (isEveningDisabled && session === "EVENING") ? (
                      <p className="text-xs text-amber-600">{t('buyMilk.cutoffWarning')}</p>
                    ) : null}
                  </>
                ) : (
                  <select value={selectedTimeSlot} onChange={handleTimeSlotChange} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required>
                    <option value="">{t('buyMilk.selectTime')}</option>
                    {timeSlots.length > 0 ? (
                      timeSlots.map((slot) => (
                        <option key={slot.value} value={slot.value}>{slot.label}</option>
                      ))
                    ) : (
                      <option disabled>{t('buyMilk.noSlotsToday')}</option>
                    )}
                  </select>
                )}
              </div>
            </div>

            {isSubscription && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">{t('buyMilk.startDate')}</label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              </div>
            )}

            {isSubscription && (!currentUser?.address || !currentUser?.city) && (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                {t('buyMilk.completeBuyerProfile')}
              </div>
            )}

            <div className="mt-2 text-sm text-muted-foreground space-y-1">
              {farm && (<p>{t('buyMilk.price')}: <span className="font-medium">₹{pricePerLiter.toFixed(2)}</span> / L</p>)}
              {estimatedTotal !== null && (<p>{t('buyMilk.total')}: <span className="font-semibold">₹{estimatedTotal.toFixed(2)}</span></p>)}
            </div>

            <CardFooter className="px-0 pb-0 flex-col items-stretch gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? t('buyMilk.processing') : isSubscription ? t('buyMilk.startSubscription') : t('buyMilk.placeOrder')}
              </Button>

              {message && (
                <div className={`text-sm rounded-md px-3 py-2 ${message.type === "error" ? "bg-destructive/10 text-destructive" : "bg-emerald-50 text-emerald-700"}`}>
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

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ComposedChart
} from 'recharts';
import { Loader2, TrendingUp, TrendingDown, Activity, Zap, ArrowLeft } from 'lucide-react';
import {
  getProductionReport,
  getNextForecast,
  getMilkHistory
} from '../api/analyticsApi';

export default function Analytics() {
  const { farmId } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [forecasts, setForecasts] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [daysRange, setDaysRange] = useState(30);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [reportData, forecastData, historyData] = await Promise.all([
        getProductionReport(farmId, daysRange),
        getNextForecast(farmId, 7),
        getMilkHistory(farmId, daysRange)
      ]);

      setReport(reportData);
      setForecasts(forecastData || []);
      setHistory(historyData || []);
    } catch (err) {
      setError(err.message || "Failed to load analytics");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [farmId, daysRange]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const chartHeight = 300;

  // Prepare forecast data for chart
  const forecastChartData = forecasts.map(f => ({
    date: new Date(f.forecastDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    forecast: Math.round(f.predictedLiters * 10) / 10,
    confidence: f.confidence
  }));

  // Combine history and forecast for comparison
  const combinedData = [
    ...history.map(h => ({
      date: new Date(h.recordDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      actual: Math.round(h.totalMilk * 10) / 10,
      type: 'history'
    })),
    ...forecastChartData.map(f => ({
      date: f.date,
      forecast: f.forecast,
      type: 'forecast'
    }))
  ];

  // eslint-disable-next-line no-unused-vars
  const StatCard = ({ title, value, icon: IconComponent, trend, color }) => (
    <div
      className="bg-card border border-border rounded-lg p-4"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{Math.abs(trend).toFixed(1)}%</span>
            </div>
          )}
        </div>
        <div className={`p-2 rounded-lg ${color}`}>
          <IconComponent className="w-5 h-5" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div
          className="flex items-center justify-between"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={() => navigate(-1)}
                className="p-1 hover:bg-secondary rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-3xl font-bold text-foreground">Production Analytics</h1>
            </div>
            {report && <p className="text-muted-foreground">{report.farmName}</p>}
          </div>
        </div>

        {error && (
          <div
            className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-lg"
          >
            {error}
          </div>
        )}

        {/* Time Range Selection */}
        <div
          className="flex gap-2"
        >
          {[7, 30, 90].map((days) => (
            <button
              key={days}
              onClick={() => setDaysRange(days)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${daysRange === days
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border bg-background text-foreground hover:bg-secondary'
                }`}
            >
              {days} Days
            </button>
          ))}
        </div>

        {/* Key Metrics */}
        <div
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          {report && (
            <>
              <StatCard
                title="Total Production"
                value={`${report.totalMilkLiters.toFixed(1)}L`}
                icon={Activity}
                color="bg-blue-500/10"
              />
              <StatCard
                title="Average Daily"
                value={`${report.averageDailyProduction.toFixed(1)}L`}
                icon={Zap}
                color="bg-yellow-500/10"
              />
              <StatCard
                title="Tomorrow's Forecast"
                value={`${report.forecastedLiters.toFixed(1)}L`}
                icon={TrendingUp}
                trend={report.trend}
                color="bg-green-500/10"
              />
              <StatCard
                title="Trend"
                value={`${Math.abs(report.trend).toFixed(1)}%`}
                icon={report.trend >= 0 ? TrendingUp : TrendingDown}
                color={report.trend >= 0 ? "bg-green-500/10" : "bg-red-500/10"}
              />
            </>
          )}
        </div>

        {/* Production Trend Chart */}
        <div
          className="bg-card border border-border rounded-lg p-6"
        >
          <h2 className="text-lg font-semibold text-foreground mb-4">Production Trend</h2>
          <ResponsiveContainer width="100%" height={chartHeight}>
            <ComposedChart data={combinedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
              />
              <Legend />
              <Bar dataKey="actual" fill="hsl(var(--primary))" name="Actual Production" />
              <Line type="monotone" dataKey="forecast" stroke="hsl(var(--chart-2))" name="Forecast" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* 7-Day Forecast */}
        {forecastChartData.length > 0 && (
          <div
            className="bg-card border border-border rounded-lg p-6"
          >
            <h2 className="text-lg font-semibold text-foreground mb-4">7-Day Forecast</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={forecastChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                />
                <Bar dataKey="forecast" fill="hsl(var(--success))" name="Predicted Liters" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Summary Stats Table */}
        {report && (
          <div
            className="bg-card border border-border rounded-lg p-6"
          >
            <h2 className="text-lg font-semibold text-foreground mb-4">Report Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Period</p>
                <p className="text-lg font-semibold text-foreground">{report.daysOfData} days</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Morning Production</p>
                <p className="text-lg font-semibold text-foreground">{report.morningMilk.toFixed(1)}L</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Evening Production</p>
                <p className="text-lg font-semibold text-foreground">{report.eveningMilk.toFixed(1)}L</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Report Date</p>
                <p className="text-lg font-semibold text-foreground">
                  {new Date(report.reportDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Confidence</p>
                <p className="text-lg font-semibold text-foreground">High</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className={`text-lg font-semibold ${report.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {report.trend >= 0 ? 'Improving' : 'Declining'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Export Button */}
        <div
          className="flex justify-end gap-2"
        >
          <button
            onClick={() => {
              // TODO: Implement PDF export
              alert("PDF export coming soon!");
            }}
            className="px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors font-medium"
          >
            Export Report
          </button>
        </div>
      </div>
    </div>
  );
}

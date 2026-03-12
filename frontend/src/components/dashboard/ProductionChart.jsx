import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { useTranslation } from 'react-i18next';

function ChartCard({ title, children, delay = 0 }) {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="bg-card border border-border rounded-xl p-5 shadow-card"
    >
      <h3 className="font-semibold text-foreground mb-4">{t(title)}</h3>
      {children}
    </motion.div>
  );
}

export function DailyProductionChart({ data = [], series = [] }) {
  const { t } = useTranslation();

  return (
    <ChartCard title="dashboard.dailyMilkProduction" delay={0.3}>
      <div className="h-[280px]">
        {data.length === 0 || series.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            {t('dashboard.noDataAvailable')}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}L`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: 'var(--shadow-md)',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value) => [`${Number(value || 0).toFixed(1)}L`, undefined]}
              />
              <Legend />
              {series.map((item) => (
                <Line
                  key={item.key}
                  type="monotone"
                  dataKey={item.key}
                  name={item.label}
                  stroke={item.color}
                  strokeWidth={3}
                  dot={{ fill: item.color, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </ChartCard>
  );
}

export function FarmComparisonChart({ farmsData = [] }) {
  const { t } = useTranslation();
  const chartData = farmsData.length > 0 ? farmsData.map(farm => ({
    name: farm.name || `Farm ${farm.id}`,
    milk: farm.todayMilk || 0,
  })) : [];

  return (
    <ChartCard title="dashboard.farmProductionComparison" delay={0.4}>
      <div className="h-[280px]">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            {t('dashboard.noDataAvailable')}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}L`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: 'var(--shadow-md)',
                }}
              />
              <Bar dataKey="milk" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </ChartCard>
  );
}

"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { useTheme } from "@/components/ui/theme-provider";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ActivityDataPoint {
  period: string;
  permits: number;
  alerts: number;
}

interface ActivityTrendChartProps {
  data: ActivityDataPoint[];
  title?: string;
  className?: string;
}

export function ActivityTrendChart({
  data,
  title = "Activity Trends",
  className = "",
}: ActivityTrendChartProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const chartData = {
    labels: data.map((d) => d.period),
    datasets: [
      {
        label: "New Permits",
        data: data.map((d) => d.permits),
        backgroundColor: "rgba(79, 70, 229, 0.8)",
        borderColor: "rgb(79, 70, 229)",
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
      },
      {
        label: "Alerts",
        data: data.map((d) => d.alerts),
        backgroundColor: "rgba(245, 158, 11, 0.8)",
        borderColor: "rgb(245, 158, 11)",
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        position: "top",
        align: "end",
        labels: {
          color: isDark ? "rgb(209, 213, 219)" : "rgb(75, 85, 99)",
          usePointStyle: true,
          pointStyle: "circle",
          padding: 16,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: isDark ? "rgb(31, 41, 55)" : "rgb(255, 255, 255)",
        titleColor: isDark ? "rgb(255, 255, 255)" : "rgb(17, 24, 39)",
        bodyColor: isDark ? "rgb(209, 213, 219)" : "rgb(75, 85, 99)",
        borderColor: isDark ? "rgb(75, 85, 99)" : "rgb(229, 231, 235)",
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: isDark ? "rgb(156, 163, 175)" : "rgb(107, 114, 128)",
          font: {
            size: 11,
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: isDark ? "rgba(75, 85, 99, 0.3)" : "rgba(229, 231, 235, 0.5)",
        },
        ticks: {
          color: isDark ? "rgb(156, 163, 175)" : "rgb(107, 114, 128)",
          font: {
            size: 11,
          },
          padding: 8,
        },
      },
    },
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {title}
      </h3>
      <div className="h-64">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}

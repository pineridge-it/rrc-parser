"use client";

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { useTheme } from "@/components/ui/theme-provider";

ChartJS.register(ArcElement, Tooltip, Legend);

interface StatusData {
  label: string;
  value: number;
  color: string;
}

interface PermitStatusChartProps {
  data: StatusData[];
  title?: string;
  className?: string;
}

export function PermitStatusChart({
  data,
  title = "Permit Status Distribution",
  className = "",
}: PermitStatusChartProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const chartData = {
    labels: data.map((d) => d.label),
    datasets: [
      {
        data: data.map((d) => d.value),
        backgroundColor: data.map((d) => d.color),
        borderColor: isDark ? "rgb(31, 41, 55)" : "rgb(255, 255, 255)",
        borderWidth: 2,
        hoverOffset: 4,
      },
    ],
  };

  const options: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "65%",
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: isDark ? "rgb(209, 213, 219)" : "rgb(75, 85, 99)",
          padding: 16,
          usePointStyle: true,
          pointStyle: "circle",
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
        callbacks: {
          label: (context) => {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          },
        },
      },
    },
  };

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {title}
      </h3>
      <div className="h-64 relative">
        <Doughnut data={chartData} options={options} />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{total}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
          </div>
        </div>
      </div>
    </div>
  );
}

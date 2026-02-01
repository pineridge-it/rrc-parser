"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useTheme } from "@/components/ui/theme-provider";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface PermitDataPoint {
  date: string;
  count: number;
}

interface PermitsOverTimeProps {
  data: PermitDataPoint[];
  title?: string;
  className?: string;
}

export function PermitsOverTime({
  data,
  title = "Permits Over Time",
  className = "",
}: PermitsOverTimeProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const chartData = {
    labels: data.map((d) =>
      new Date(d.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    ),
    datasets: [
      {
        label: "New Permits",
        data: data.map((d) => d.count),
        fill: true,
        borderColor: "rgb(79, 70, 229)",
        backgroundColor: isDark
          ? "rgba(79, 70, 229, 0.2)"
          : "rgba(79, 70, 229, 0.1)",
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: "rgb(79, 70, 229)",
        pointBorderColor: isDark ? "rgb(17, 24, 39)" : "rgb(255, 255, 255)",
        pointBorderWidth: 2,
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: isDark ? "rgb(31, 41, 55)" : "rgb(255, 255, 255)",
        titleColor: isDark ? "rgb(255, 255, 255)" : "rgb(17, 24, 39)",
        bodyColor: isDark ? "rgb(209, 213, 219)" : "rgb(75, 85, 99)",
        borderColor: isDark ? "rgb(75, 85, 99)" : "rgb(229, 231, 235)",
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: (context) => `${context.parsed.y} permits`,
        },
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
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}

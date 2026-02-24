"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip);

interface MetricSparklineProps {
  data: number[];
  color?: string;
  className?: string;
  height?: number;
}

export function MetricSparkline({
  data,
  color = "rgb(79, 70, 229)",
  className = "",
  height = 40,
}: MetricSparklineProps) {
  const chartData = {
    labels: data.map((_, i) => i),
    datasets: [
      {
        data,
        borderColor: color,
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        mode: "index" as const,
        intersect: false,
        callbacks: {
          title: () => "",
          label: (context: any) => `Value: ${context.parsed.y}`,
        },
      },
    },
    scales: {
      x: { display: false },
      y: { display: false },
    },
  };

  return (
    <div className={className} style={{ height }}>
      <Line data={chartData} options={options} />
    </div>
  );
}

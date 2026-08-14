import React, { useState, useMemo } from 'react';
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
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useStore } from '../../hooks/useStore';
import { Calendar, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import './RevenueLineChart.css';

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

const MONTH_NAMES_ID = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

export function RevenueLineChart({ defaultPeriod = 'bulanan', showHeader = true, title = 'Grafik Laba Rugi Periodik' }) {
  const [periodMode, setPeriodMode] = useState(defaultPeriod); // 'harian' | 'bulanan' | 'tahunan'
  const [visibleDataset, setVisibleDataset] = useState('ALL'); // 'ALL' | 'LABA' | 'PENDAPATAN' | 'PENGELUARAN'

  const { data: pemasukanData } = useStore('pemasukan');
  const { data: pengeluaranData } = useStore('pengeluaran');

  // Compute dynamic chart data based on periodMode
  const chartData = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();

    let labels = [];
    let incomeData = [];
    let expenseData = [];
    let profitData = [];

    if (periodMode === 'harian') {
      // 14 Hari Terakhir
      const daysCount = 14;
      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        const dayLabel = `${d.getDate()} ${MONTH_NAMES_ID[d.getMonth()]}`;
        labels.push(dayLabel);

        const inc = (pemasukanData || [])
          .filter((p) => p.tanggal === dateStr)
          .reduce((sum, p) => sum + (Number(p.nominal) || 0), 0);

        const exp = (pengeluaranData || [])
          .filter((p) => p.tanggal === dateStr)
          .reduce((sum, p) => sum + (Number(p.nominal) || 0), 0);

        incomeData.push(inc);
        expenseData.push(exp);
        profitData.push(inc - exp);
      }
    } else if (periodMode === 'bulanan') {
      // 12 Bulan dalam Tahun Berjalan
      for (let m = 0; m < 12; m++) {
        labels.push(`${MONTH_NAMES_ID[m]} ${String(currentYear).slice(2)}`);
        const monthPrefix = `${currentYear}-${String(m + 1).padStart(2, '0')}`;

        const inc = (pemasukanData || [])
          .filter((p) => p.tanggal?.startsWith(monthPrefix))
          .reduce((sum, p) => sum + (Number(p.nominal) || 0), 0);

        const exp = (pengeluaranData || [])
          .filter((p) => p.tanggal?.startsWith(monthPrefix))
          .reduce((sum, p) => sum + (Number(p.nominal) || 0), 0);

        incomeData.push(inc);
        expenseData.push(exp);
        profitData.push(inc - exp);
      }
    } else if (periodMode === 'tahunan') {
      // 5 Tahun Terakhir
      for (let y = currentYear - 4; y <= currentYear; y++) {
        labels.push(String(y));
        const yearPrefix = String(y);

        const inc = (pemasukanData || [])
          .filter((p) => p.tanggal?.startsWith(yearPrefix))
          .reduce((sum, p) => sum + (Number(p.nominal) || 0), 0);

        const exp = (pengeluaranData || [])
          .filter((p) => p.tanggal?.startsWith(yearPrefix))
          .reduce((sum, p) => sum + (Number(p.nominal) || 0), 0);

        incomeData.push(inc);
        expenseData.push(exp);
        profitData.push(inc - exp);
      }
    }

    const datasets = [];

    // Dataset Laba Bersih
    if (visibleDataset === 'ALL' || visibleDataset === 'LABA') {
      datasets.push({
        label: 'Laba Bersih',
        data: profitData,
        borderColor: '#2563EB',
        backgroundColor: 'rgba(37, 99, 235, 0.08)',
        fill: true,
        tension: 0.35,
        borderWidth: 2.5,
        pointBackgroundColor: '#2563EB',
        pointBorderColor: '#FFFFFF',
        pointRadius: 4,
        pointHoverRadius: 6,
      });
    }

    // Dataset Pendapatan
    if (visibleDataset === 'ALL' || visibleDataset === 'PENDAPATAN') {
      datasets.push({
        label: 'Pendapatan (Pemasukan)',
        data: incomeData,
        borderColor: '#10B981',
        backgroundColor: 'transparent',
        borderDash: visibleDataset === 'ALL' ? [4, 4] : [],
        tension: 0.35,
        borderWidth: 2,
        pointBackgroundColor: '#10B981',
        pointBorderColor: '#FFFFFF',
        pointRadius: 3.5,
        pointHoverRadius: 5,
      });
    }

    // Dataset Pengeluaran
    if (visibleDataset === 'ALL' || visibleDataset === 'PENGELUARAN') {
      datasets.push({
        label: 'Pengeluaran (Biaya)',
        data: expenseData,
        borderColor: '#EF4444',
        backgroundColor: 'transparent',
        borderDash: visibleDataset === 'ALL' ? [3, 3] : [],
        tension: 0.35,
        borderWidth: 2,
        pointBackgroundColor: '#EF4444',
        pointBorderColor: '#FFFFFF',
        pointRadius: 3.5,
        pointHoverRadius: 5,
      });
    }

    return {
      labels,
      datasets,
      totalIncomePeriod: incomeData.reduce((a, b) => a + b, 0),
      totalExpensePeriod: expenseData.reduce((a, b) => a + b, 0),
      totalProfitPeriod: profitData.reduce((a, b) => a + b, 0),
    };
  }, [periodMode, visibleDataset, pemasukanData, pengeluaranData]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        align: 'end',
        labels: {
          boxWidth: 12,
          boxHeight: 12,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 12, weight: '500' },
          color: '#64748B',
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        padding: 12,
        titleFont: { size: 13, weight: 'bold' },
        bodyFont: { size: 12 },
        cornerRadius: 8,
        callbacks: {
          label: function (context) {
            const val = context.parsed.y || 0;
            const prefix = val < 0 ? '-Rp ' : 'Rp ';
            return ` ${context.dataset.label}: ${prefix}${Math.abs(val).toLocaleString('id-ID')}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#94A3B8',
          font: { size: 11, weight: '500' },
        },
      },
      y: {
        grid: {
          color: 'rgba(226, 232, 240, 0.6)',
        },
        ticks: {
          color: '#94A3B8',
          font: { size: 11 },
          callback: function (value) {
            if (value === 0) return 'Rp 0';
            if (Math.abs(value) >= 1000000) {
              return `Rp ${(value / 1000000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} Jt`;
            }
            if (Math.abs(value) >= 1000) {
              return `Rp ${(value / 1000).toLocaleString('id-ID', { maximumFractionDigits: 0 })} Rb`;
            }
            return `Rp ${value}`;
          },
        },
      },
    },
  };

  return (
    <div className="revenue-chart-wrapper">
      {showHeader && (
        <div className="revenue-chart-header">
          <div className="chart-title-box">
            <h3 className="chart-main-title">{title}</h3>
            <div className="chart-summary-chips">
              <span className="chart-chip chip-inc">
                Pendapatan: <strong>Rp {chartData.totalIncomePeriod.toLocaleString('id-ID')}</strong>
              </span>
              <span className="chart-chip chip-exp">
                Pengeluaran: <strong>Rp {chartData.totalExpensePeriod.toLocaleString('id-ID')}</strong>
              </span>
              <span className={`chart-chip ${chartData.totalProfitPeriod >= 0 ? 'chip-profit' : 'chip-loss'}`}>
                Laba Bersih: <strong>Rp {chartData.totalProfitPeriod.toLocaleString('id-ID')}</strong>
              </span>
            </div>
          </div>

          {/* Period Selector Tabs */}
          <div className="chart-period-tabs">
            <button
              type="button"
              className={`period-btn ${periodMode === 'harian' ? 'active' : ''}`}
              onClick={() => setPeriodMode('harian')}
            >
              Per Hari (14 Hari)
            </button>
            <button
              type="button"
              className={`period-btn ${periodMode === 'bulanan' ? 'active' : ''}`}
              onClick={() => setPeriodMode('bulanan')}
            >
              Per Bulan ({new Date().getFullYear()})
            </button>
            <button
              type="button"
              className={`period-btn ${periodMode === 'tahunan' ? 'active' : ''}`}
              onClick={() => setPeriodMode('tahunan')}
            >
              Setahun (5 Tahun)
            </button>
          </div>
        </div>
      )}

      {/* Chart Canvas */}
      <div className="chart-canvas-container">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}

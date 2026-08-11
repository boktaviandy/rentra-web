import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../components/ui/PageHeader';
import { Modal } from '../../components/ui/Modal';
import {
  Filter,
  ChevronLeft,
  ChevronRight,
  Car,
  CheckCircle2,
  Clock,
  KeyRound,
  RotateCcw,
  Receipt,
  Eye,
  Wrench,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTenantStore } from '../../hooks/useTenantStore';
import { Badge, getStatusBadgeVariant } from '../../components/ui/Badge';
import './KalenderPage.css';

export function KalenderPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: bookingData } = useTenantStore('booking');
  const { data: mobilData } = useTenantStore('mobil');

  const [selectedMobilId, setSelectedMobilId] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'RETURN_ONLY' | 'PICKUP_ONLY'
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [dayDropdownEvents, setDayDropdownEvents] = useState(null); // { dateStr, dayNum, events }

  // Calendar State: Dynamic current month & year
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth()); // 0-indexed

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
  };

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Adjusted start offset (Monday = 0, Sunday = 6)
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const gridDays = [];
  for (let i = 0; i < startOffset; i++) {
    gridDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    gridDays.push(d);
  }

  const formatDateStr = (dayNum) => {
    const mStr = String(currentMonth + 1).padStart(2, '0');
    const dStr = String(dayNum).padStart(2, '0');
    return `${currentYear}-${mStr}-${dStr}`;
  };

  // Helper to extract events for a given day
  const getEventsForDate = (dateStr) => {
    const events = [];

    bookingData.forEach((b) => {
      if (selectedMobilId !== 'ALL' && b.mobilId !== selectedMobilId) return;

      const isStart = dateStr === b.tglMulai;
      const isEnd = dateStr === b.tglSelesai;
      const isInside = dateStr >= b.tglMulai && dateStr <= b.tglSelesai;

      if (isInside) {
        let role = 'ongoing';
        let roleLabel = 'Sedang Disewa';
        let tagLabel = `${b.mobilNama || 'Mobil'}`;
        let variant = 'indigo';

        if (isStart && isEnd) {
          role = 'sameday';
          roleLabel = 'Mulai & Kembali Hari Ini';
          tagLabel = `⚡ Kembali: ${b.mobilNama || 'Mobil'}`;
          variant = 'emerald';
        } else if (isEnd) {
          role = 'return';
          roleLabel = 'Jadwal Mobil Kembali';
          tagLabel = `🏁 Kembali: ${b.mobilNama || 'Mobil'}`;
          variant = 'emerald';
        } else if (isStart) {
          role = 'pickup';
          roleLabel = 'Mulai Sewa (Penyerahan Unit)';
          tagLabel = `🔑 Mulai: ${b.mobilNama || 'Mobil'}`;
          variant = 'blue';
        } else {
          role = 'ongoing';
          roleLabel = 'Sedang Disewa';
          tagLabel = `🚗 ${b.mobilNama || 'Mobil'}`;
          variant = 'indigo';
        }

        // Apply filter tab
        if (filterType === 'RETURN_ONLY' && role !== 'return' && role !== 'sameday') return;
        if (filterType === 'PICKUP_ONLY' && role !== 'pickup' && role !== 'sameday') return;

        events.push({
          id: `${b.id}-${role}-${dateStr}`,
          bookingId: b.id,
          role,
          roleLabel,
          tagLabel,
          variant,
          mobilNama: b.mobilNama,
          mobilPlat: b.mobilPlat,
          customerNama: b.customerNama,
          startDate: b.tglMulai,
          endDate: b.tglSelesai,
          status: b.status,
          statusPembayaran: b.statusPembayaran || 'Lunas',
          harga: b.harga || b.totalHarga || 0,
          deposit: b.deposit || 0,
          driverNama: b.driverNama || 'Lepas Kunci',
          catatan: b.catatan,
          type: 'booking'
        });
      }
    });

    if (filterType === 'ALL') {
      mobilData
        .filter((m) => m.status === 'Servis')
        .forEach((m) => {
          if (selectedMobilId === 'ALL' || m.id === selectedMobilId) {
            events.push({
              id: `SERVIS-${m.id}`,
              role: 'servis',
              roleLabel: 'Dalam Servis Bengkel',
              tagLabel: `🔧 Servis: ${m.nama}`,
              variant: 'red',
              mobilNama: m.nama,
              mobilPlat: m.plat,
              catatan: m.catatan || 'Perawatan armada',
              type: 'servis'
            });
          }
        });
    }

    return events;
  };

  // Month Statistics
  const monthStats = useMemo(() => {
    const currentMonthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    let totalReturns = 0;
    let totalPickups = 0;
    let activeBookings = 0;

    bookingData.forEach((b) => {
      if (b.tglSelesai?.startsWith(currentMonthPrefix)) totalReturns++;
      if (b.tglMulai?.startsWith(currentMonthPrefix)) totalPickups++;
      if (b.status === 'Berjalan' || b.status === 'Booking') activeBookings++;
    });

    return { totalReturns, totalPickups, activeBookings };
  }, [bookingData, currentYear, currentMonth]);

  const realTodayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="kalender-page">
      <PageHeader
        title={t('nav.kalender')}
        description="Jadwal ketersediaan armada, penyerahan unit, dan pengembalian mobil."
        action={
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/booking')}>
            + Tambah Booking
          </button>
        }
      />

      {/* Minimalist Calendar Card */}
      <div className="calendar-card-minimal">
        {/* Sleek Toolbar */}
        <div className="cal-minimal-header">
          <div className="cal-header-left">
            <h2 className="cal-title-minimal">
              {monthNames[currentMonth]} <span className="cal-year-dim">{currentYear}</span>
            </h2>

            <div className="cal-nav-group">
              <button className="cal-nav-btn" onClick={handlePrevMonth} title="Bulan Sebelumnya">
                <ChevronLeft size={16} />
              </button>
              <button className="cal-today-btn" onClick={handleToday}>
                Hari Ini
              </button>
              <button className="cal-nav-btn" onClick={handleNextMonth} title="Bulan Berikutnya">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="cal-header-right">
            {/* Filter Tabs */}
            <div className="cal-tabs-minimal">
              <button
                className={`cal-tab-item ${filterType === 'ALL' ? 'active' : ''}`}
                onClick={() => setFilterType('ALL')}
              >
                Semua ({bookingData.length})
              </button>
              <button
                className={`cal-tab-item ${filterType === 'RETURN_ONLY' ? 'active' : ''}`}
                onClick={() => setFilterType('RETURN_ONLY')}
              >
                🏁 Mobil Kembali ({monthStats.totalReturns})
              </button>
              <button
                className={`cal-tab-item ${filterType === 'PICKUP_ONLY' ? 'active' : ''}`}
                onClick={() => setFilterType('PICKUP_ONLY')}
              >
                🔑 Mulai Sewa ({monthStats.totalPickups})
              </button>
            </div>

            {/* Filter Unit */}
            <div className="cal-unit-select-box">
              <Filter size={13} className="text-muted" />
              <select
                className="cal-select-minimal"
                value={selectedMobilId}
                onChange={(e) => setSelectedMobilId(e.target.value)}
              >
                <option value="ALL">Semua Unit</option>
                {mobilData.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nama} ({m.plat})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Legend Minimal */}
        <div className="cal-legend-minimal">
          <div className="cal-legend-pill">
            <span className="cal-dot dot-return"></span>
            <span>Jadwal Mobil Kembali</span>
          </div>
          <div className="cal-legend-pill">
            <span className="cal-dot dot-pickup"></span>
            <span>Mulai Sewa</span>
          </div>
          <div className="cal-legend-pill">
            <span className="cal-dot dot-ongoing"></span>
            <span>Sedang Disewa</span>
          </div>
          <div className="cal-legend-pill">
            <span className="cal-dot dot-servis"></span>
            <span>Servis</span>
          </div>
        </div>

        {/* Minimal Grid Table */}
        <div className="cal-grid-minimal">
          {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Ming'].map((dayName, idx) => (
            <div key={idx} className="cal-col-header-minimal">
              {dayName}
            </div>
          ))}

          {gridDays.map((dayNum, idx) => {
            if (dayNum === null) {
              return <div key={`empty-${idx}`} className="cal-day-cell-minimal empty-day" />;
            }

            const dateStr = formatDateStr(dayNum);
            const dayEvents = getEventsForDate(dateStr);
            const isToday = dateStr === realTodayStr;

            return (
              <div
                key={dayNum}
                className={`cal-day-cell-minimal ${isToday ? 'is-today' : ''} ${dayEvents.length > 0 ? 'has-events' : ''}`}
                onClick={() => {
                  if (dayEvents.length > 0) {
                    setDayDropdownEvents({ dateStr, dayNum, events: dayEvents });
                  }
                }}
              >
                <div className="cal-day-top">
                  <span className={`cal-day-num ${isToday ? 'num-today' : ''}`}>{dayNum}</span>
                </div>

                <div className="cal-day-events">
                  {dayEvents.slice(0, 2).map((ev) => (
                    <div
                      key={ev.id}
                      className={`cal-event-badge role-${ev.role}`}
                      title={`${ev.roleLabel}: ${ev.mobilNama} (${ev.customerNama || ''})`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEvent(ev);
                      }}
                    >
                      <span className="cal-event-text">{ev.tagLabel}</span>
                    </div>
                  ))}

                  {dayEvents.length > 2 && (
                    <span className="cal-more-text">
                      +{dayEvents.length - 2} lainnya
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>


      {/* Day Events Modal */}
      <Modal
        isOpen={!!dayDropdownEvents}
        onClose={() => setDayDropdownEvents(null)}
        title={dayDropdownEvents ? `Jadwal Tanggal ${dayDropdownEvents.dayNum} ${monthNames[currentMonth]} ${currentYear}` : ''}
        footer={
          <button className="btn btn-secondary" onClick={() => setDayDropdownEvents(null)}>
            Tutup
          </button>
        }
      >
        {dayDropdownEvents && (
          <div className="day-dropdown-modal-list">
            <p className="subtext" style={{ marginBottom: '12px' }}>
              Daftar seluruh aktivitas rental pada tanggal <strong>{dayDropdownEvents.dateStr}</strong>:
            </p>
            {dayDropdownEvents.events.map((ev) => (
              <div
                key={ev.id}
                className={`dropdown-event-card border-role-${ev.role}`}
                onClick={() => {
                  setDayDropdownEvents(null);
                  setSelectedEvent(ev);
                }}
              >
                <div className="event-card-header">
                  <div className="event-role-badge">
                    {ev.role === 'return' ? <RotateCcw size={14} /> : ev.role === 'pickup' ? <KeyRound size={14} /> : <Car size={14} />}
                    <span>{ev.roleLabel}</span>
                  </div>
                  <Badge variant={getStatusBadgeVariant(ev.status)}>{ev.status}</Badge>
                </div>

                <div className="event-card-body">
                  <div className="event-car-title">{ev.mobilNama} {ev.mobilPlat && <span className="plat-badge-sm">{ev.mobilPlat}</span>}</div>
                  {ev.customerNama && <div className="event-cust-name">Pelanggan: <strong>{ev.customerNama}</strong></div>}
                  <div className="event-date-sub">
                    Periode: {ev.startDate} s/d {ev.endDate}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Event Detail Modal */}
      <Modal
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        title={selectedEvent ? `Detail ${selectedEvent.roleLabel}` : 'Detail Jadwal'}
        footer={
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
            {selectedEvent?.bookingId && (
              <>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    navigate(`/invoice/${selectedEvent.bookingId}`);
                  }}
                >
                  <Receipt size={14} /> Cetak Invoice
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    navigate(`/booking/${selectedEvent.bookingId}`);
                  }}
                >
                  <Eye size={14} /> Detail Booking
                </button>
              </>
            )}
            <button className="btn btn-secondary" onClick={() => setSelectedEvent(null)}>
              Tutup
            </button>
          </div>
        }
      >
        {selectedEvent && (
          <div className="event-detail-box">
            <div className={`event-detail-hero-banner hero-role-${selectedEvent.role}`}>
              <div className="hero-banner-icon">
                {selectedEvent.role === 'return' ? <RotateCcw size={24} /> : selectedEvent.role === 'pickup' ? <KeyRound size={24} /> : <Car size={24} />}
              </div>
              <div>
                <h4 style={{ margin: 0 }}>{selectedEvent.roleLabel}</h4>
                <p style={{ margin: 0, fontSize: '12px', opacity: 0.9 }}>
                  {selectedEvent.mobilNama} • {selectedEvent.mobilPlat || 'Unit Rental'}
                </p>
              </div>
            </div>

            <div className="event-detail-row">
              <strong>Nama Mobil:</strong>
              <span>{selectedEvent.mobilNama} ({selectedEvent.mobilPlat || '-'})</span>
            </div>

            {selectedEvent.customerNama && (
              <div className="event-detail-row">
                <strong>Pelanggan:</strong>
                <span style={{ fontWeight: '600', color: 'var(--primary)' }}>{selectedEvent.customerNama}</span>
              </div>
            )}

            {selectedEvent.startDate && (
              <div className="event-detail-row">
                <strong>Jadwal Mulai Sewa:</strong>
                <span>{selectedEvent.startDate}</span>
              </div>
            )}

            {selectedEvent.endDate && (
              <div className="event-detail-row" style={{ background: '#ECFDF5', padding: '6px 8px', borderRadius: '6px' }}>
                <strong style={{ color: '#065F46' }}>🏁 Jadwal Pengembalian:</strong>
                <span style={{ fontWeight: '700', color: '#065F46' }}>{selectedEvent.endDate}</span>
              </div>
            )}

            <div className="event-detail-row">
              <strong>Driver:</strong>
              <span>{selectedEvent.driverNama || 'Tanpa Driver (Lepas Kunci)'}</span>
            </div>

            <div className="event-detail-row">
              <strong>Status Booking:</strong>
              <Badge variant={getStatusBadgeVariant(selectedEvent.status)}>{selectedEvent.status}</Badge>
            </div>

            {selectedEvent.harga > 0 && (
              <div className="event-detail-row">
                <strong>Total Biaya:</strong>
                <span className="text-success font-semibold">Rp {Number(selectedEvent.harga).toLocaleString('id-ID')}</span>
              </div>
            )}

            {selectedEvent.catatan && (
              <div className="event-detail-row">
                <strong>Catatan:</strong>
                <span>{selectedEvent.catatan}</span>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}


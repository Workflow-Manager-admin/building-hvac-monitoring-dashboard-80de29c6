import React, { useState, useMemo, useEffect, useCallback } from "react";

/**
 * Color palette and theme variables per requirements
 */
const COLORS = {
  primary: "#2f80ed",
  secondary: "#56cc9d",
  accent: "#f2994a",
  bg: "#fff",
  text: "#222",
  gridBorder: "#eff0f2",
  notificationBg: "#fef5ef", // notification background
  notificationText: "#b76b32", // notification text
};
const ZONES_COUNT = 100;
const TEMP_RANGE = { min: 17, max: 32 };
const PERF_RANGE = { min: 30, max: 100 };

// Helper to generate random float in range
function randomInRange(min, max, fixed = 1) {
  return +(Math.random() * (max - min) + min).toFixed(fixed);
}

// Generate array of zones, each with a zone ID, name, temp, hvac performance
function generateZones() {
  // Could use room/zone names like "Room A1", "Room A2", etc.
  const zones = [];
  for (let i = 1; i <= ZONES_COUNT; i++) {
    zones.push({
      id: i,
      name: `Zone ${i}`,
      room: `Room ${String.fromCharCode(65 + Math.floor((i-1)/10))}${((i-1)%10)+1}`,
      temperature: randomInRange(TEMP_RANGE.min, TEMP_RANGE.max),
      hvac_performance: randomInRange(PERF_RANGE.min, PERF_RANGE.max),
      // Add more zone/device metadata here if needed
    });
  }
  return zones;
}

// Simulate random sensor/zone updates
function randomizeZones(zones) {
  return zones.map((z) => ({
    ...z,
    temperature: Math.max(
      TEMP_RANGE.min,
      Math.min(TEMP_RANGE.max, z.temperature + randomInRange(-0.6, 0.7))
    ),
    hvac_performance: Math.max(
      PERF_RANGE.min,
      Math.min(PERF_RANGE.max, z.hvac_performance + randomInRange(-3, 2))
    ),
  }));
}

/**
 * Notification panel for maintenance alerts
 */
function NotificationPanel({ zones }) {
  // Find underperforming zones
  const alerts = zones
    .filter((z) => z.hvac_performance < 50)
    .map((z) => ({
      id: z.id,
      message: `Maintenance Required: ${z.name} (${z.room}) -- Performance at ${z.hvac_performance.toFixed(0)}%`,
    }));

  if (alerts.length === 0) return null;
  return (
    <aside style={{
      background: COLORS.notificationBg,
      color: COLORS.notificationText,
      border: `1px solid ${COLORS.accent}`,
      borderRadius: 8,
      padding: "16px 24px",
      marginBottom: 24
    }}>
      <strong style={{color: COLORS.accent}}>⚠ Maintenance Alerts</strong>
      <ul style={{marginTop: 8, marginBottom: 0, paddingLeft: 24}}>
        {alerts.map(a => (
          <li key={a.id} style={{margin: "8px 0"}}>{a.message}</li>
        ))}
      </ul>
    </aside>
  );
}

/**
 * ZoneGrid component: Interactive temperature/performance dashboard in grid layout
 */
function ZoneGrid({ zones, onSelect, selectedZoneId }) {
  // Arrange in a 10x10 grid
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(10, 1fr)",
        gridGap: 12,
        background: COLORS.bg,
        borderRadius: 12,
        border: `1px solid ${COLORS.gridBorder}`,
        padding: 20,
        marginBottom: 32,
        boxShadow: "0 2px 12px rgba(50,140,240,0.03)",
      }}
    >
      {zones.map((zone) => {
        const tempColor =
          zone.temperature > 28
            ? COLORS.accent
            : zone.temperature < 20
            ? COLORS.primary
            : COLORS.secondary;
        const perfColor =
          zone.hvac_performance < 50
            ? COLORS.accent
            : zone.hvac_performance < 65
            ? "#f2c94c"
            : COLORS.secondary;

        return (
          <button
            type="button"
            key={zone.id}
            onClick={() => onSelect && onSelect(zone.id)}
            style={{
              border: selectedZoneId === zone.id ? `2px solid ${COLORS.primary}` : `1px solid ${COLORS.gridBorder}`,
              borderRadius: 7,
              background: "#f9fbfc",
              padding: "13px 4px 13px 4px",
              cursor: "pointer",
              outline: "none",
              transition: "box-shadow .18s, border-color .18s",
              boxShadow: selectedZoneId === zone.id ? `0 0 3px ${COLORS.primary}66` : undefined,
              position: "relative",
              minWidth: 0
            }}
            title={`${zone.name} (${zone.room})`}
          >
            <span style={{
              fontSize: 13,
              fontWeight: 700,
              color: COLORS.text,
              display: "block",
              marginBottom: 3,
              textOverflow: "ellipsis",
              overflow: "hidden",
              whiteSpace: "nowrap",
            }}>
              {zone.room}
            </span>
            <span style={{
              fontSize: 17,
              fontWeight: 800,
              color: tempColor,
            }}>
              {zone.temperature.toFixed(1)}
              <span style={{
                fontSize: 12,
                color: "#bbb",
                fontWeight: 400,
                marginLeft: 1
              }}>°C</span>
            </span>
            <div style={{
              fontSize: 11,
              marginTop: 1,
              color: perfColor,
              fontWeight: 600
            }}>
              {zone.hvac_performance.toFixed(0)}% perf
            </div>
            {/* Dot indicator for maintenance alert */}
            {zone.hvac_performance < 50 &&
              <span style={{
                display: "block",
                position: "absolute",
                top: 4, right: 8,
                width: 12, height: 12,
                borderRadius: "50%",
                background: COLORS.accent,
                border: "2px solid #fff",
                boxShadow: "0 0 4px #f2994a88",
              }} title="Maintenance required"></span>
            }
          </button>
        );
      })}
    </div>
  );
}

/**
 * Dashboard search/filter and main logic
 */
function ControlsBar({ filterValue, setFilterValue }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 16,
        marginBottom: 20,
        alignItems: "center",
        justifyContent: "flex-start",
        flexWrap: "wrap"
      }}
    >
      <input
        style={{
          background: "#f8fafb",
          border: `1px solid ${COLORS.gridBorder}`,
          borderRadius: 7,
          padding: "8px 14px",
          fontSize: 15,
          minWidth: 220,
          color: "#28292c"
        }}
        type="text"
        placeholder="Search by room or zone..."
        value={filterValue}
        onChange={e => setFilterValue(e.target.value)}
        aria-label="Filter zones by name or room"
      />
      <span style={{fontSize: 13, color: "#999"}}>({ZONES_COUNT} total zones)</span>
    </div>
  );
}

/**
 * Optional: Expanded zone card shown when a grid cell selected
 */
function ZoneDetails({ zone, onClose }) {
  if (!zone) return null;
  const perfColor =
    zone.hvac_performance < 50
      ? COLORS.accent
      : zone.hvac_performance < 65
      ? "#f2c94c"
      : COLORS.secondary;

  return (
    <div style={{
      background: "#fff",
      border: `2px solid ${perfColor}`,
      boxShadow: "0 6px 32px rgba(180,200,220,0.13)",
      borderRadius: 12,
      padding: 26,
      position: "fixed",
      top: 56, left: "50%", transform: "translateX(-50%)",
      minWidth: 300, maxWidth: "92vw",
      zIndex: 35,
      color: "#202222",
      transition: "all 0.2s",
      fontSize: 15
    }}>
      <button onClick={onClose} style={{
        border: "none",
        background: "transparent",
        position: "absolute",
        top: 10,
        right: 10,
        fontSize: 23,
        cursor: "pointer",
        color: "#bbb",
      }} title="Close">&times;</button>
      <h3 style={{marginTop: 0, color: COLORS.primary}}>{zone.name} ({zone.room})</h3>
      <div>
        <span style={{fontWeight: 600}}>Temp:</span>{" "}
        <span style={{fontWeight: 700, color: COLORS.accent, fontSize: 22}}>
          {zone.temperature.toFixed(1)}°C
        </span>
      </div>
      <div>
        <span style={{fontWeight: 600}}>HVAC Performance:</span>{" "}
        <span style={{fontWeight: 700, color: perfColor, fontSize: 20}}>
          {zone.hvac_performance.toFixed(1)}%
        </span>
        {zone.hvac_performance < 50 && (
          <span style={{ color: COLORS.accent, marginLeft: 7, fontWeight: 600 }}>⚠ Needs Maintenance</span>
        )}
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
function Dashboard() {
  // Zones state: array of zones with dynamic stats
  const [zones, setZones] = useState(() => generateZones());
  // Filter bar state
  const [filter, setFilter] = useState("");
  // Expanded/selected zone
  const [selectedZone, setSelectedZone] = useState(null);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setZones(oldZones => randomizeZones(oldZones));
    }, 2200); // ~2.2 seconds
    return () => clearInterval(interval);
  }, []);

  // Filtering logic: match room or zone name (case-insensitive)
  const filteredZones = useMemo(() => {
    if (!filter) return zones;
    const term = filter.toLowerCase();
    return zones.filter(
      z =>
        z.name.toLowerCase().includes(term) ||
        z.room.toLowerCase().includes(term)
    );
  }, [zones, filter]);

  // Selected zone object
  const currentSelectedZone = useMemo(
    () => zones.find((z) => z.id === selectedZone),
    [selectedZone, zones]
  );

  // Keyboard event to close expanded dialog with ESC
  useEffect(() => {
    if (!selectedZone) return;
    function handler(e) {
      if (e.key === "Escape") setSelectedZone(null);
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedZone]);

  // Filtering/search, dashboard, notifications
  return (
    <main style={{
      maxWidth: 1100,
      margin: "0 auto",
      padding: "28px 8px 36px 8px",
      background: COLORS.bg
    }}>
      <section style={{ textAlign: "left", marginBottom: 18 }}>
        <h1 style={{ fontSize: 28, margin: 0, color: COLORS.primary, fontWeight: 900 }}>
          HVAC Building Dashboard
        </h1>
        <span style={{ color: "#888", fontSize: 16 }}>
          Monitoring temperature & performance for <b>100</b> zones
        </span>
      </section>
      <NotificationPanel zones={zones} />
      <ControlsBar filterValue={filter} setFilterValue={setFilter} />
      <ZoneGrid
        zones={filteredZones}
        onSelect={setSelectedZone}
        selectedZoneId={selectedZone}
      />
      <ZoneDetails zone={currentSelectedZone} onClose={() => setSelectedZone(null)} />
    </main>
  );
}

export default Dashboard;

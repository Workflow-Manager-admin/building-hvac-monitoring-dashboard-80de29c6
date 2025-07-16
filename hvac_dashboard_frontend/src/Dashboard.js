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
  ringBg: "#f9fbfc",
  ringStroke: "#e2e9f1",
  highlight: "#FFCE7B",
  danger: "#f2994a",
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
  const zones = [];
  for (let i = 1; i <= ZONES_COUNT; i++) {
    zones.push({
      id: i,
      name: `Zone ${i}`,
      room: `Room ${String.fromCharCode(65 + Math.floor((i - 1) / 10))}${((i - 1) % 10) + 1}`,
      temperature: randomInRange(TEMP_RANGE.min, TEMP_RANGE.max),
      hvac_performance: randomInRange(PERF_RANGE.min, PERF_RANGE.max),
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
      <strong style={{ color: COLORS.accent }}>⚠ Maintenance Alerts</strong>
      <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 24 }}>
        {alerts.map(a => (
          <li key={a.id} style={{ margin: "8px 0" }}>{a.message}</li>
        ))}
      </ul>
    </aside>
  );
}

/**
 * ZoneRadialDashboard: Modern circular/radial dashboard showing all zones
 */
function ZoneRadialDashboard({ zones, onSelect, selectedZoneId }) {
  // Settings
  const SIZE = 540; // SVG canvas size
  const center = SIZE / 2;
  const zoneRings = 4;
  const zonesPerRing = [16, 24, 28, 32];
  const maxZones = zones.length;
  const ringRadiusStep = 43;
  const startRadius = 62;
  let totalDrawn = 0;
  const sectors = [];

  zonesPerRing.forEach((count, ringIndex) => {
    for (let i = 0; i < count && totalDrawn < maxZones; i++, totalDrawn++) {
      const zone = zones[totalDrawn];
      // Compute angular position
      const angle = (2 * Math.PI * i) / count - Math.PI / 2; // start at top
      const radius = startRadius + ringRadiusStep * ringIndex;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
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
      const highlight = selectedZoneId === zone.id;

      sectors.push(
        <g key={`zone-${zone.id}`}>
          {/* outer circle */}
          <circle
            cx={x}
            cy={y}
            r={19.5}
            fill={highlight ? COLORS.highlight : COLORS.ringBg}
            stroke={highlight ? COLORS.primary : COLORS.ringStroke}
            strokeWidth={highlight ? 4 : 1.8}
            style={{
              filter: highlight ? "drop-shadow(0 0 6px #2f80ed55)" : undefined,
              cursor: "pointer",
              transition: "all .11s"
            }}
            onClick={() => onSelect && onSelect(zone.id)}
            tabIndex={0}
            aria-label={`View details for ${zone.name} (${zone.room})`}
          />
          {/* Zone temp reading */}
          <text
            x={x}
            y={y + 3.5}
            textAnchor="middle"
            fontWeight="bold"
            fontSize="13"
            fill={tempColor}
            style={{ userSelect: "none", pointerEvents: "none", fontFamily: 'inherit' }}
          >
            {zone.temperature.toFixed(1)}°
          </text>
          {/* room */}
          <text
            x={x}
            y={y + 16}
            textAnchor="middle"
            fontSize="9"
            fill="#bbb"
            style={{ userSelect: "none", pointerEvents: "none" }}
          >
            {zone.room}
          </text>
          {/* performance small arc indicator */}
          <path
            d={describeArc(
              x, y, 18.7,
              -80,
              Math.min(280, -80 + (zone.hvac_performance - 30) * 2.3)
            )}
            stroke={perfColor}
            strokeWidth="4"
            fill="none"
            opacity={zone.hvac_performance !== undefined ? "1" : "0"}
          />
          {/* Underperforming alert dot */}
          {zone.hvac_performance < 50 && (
            <circle
              cx={x + 13 * Math.cos(0.8)}
              cy={y + 13 * Math.sin(0.8)}
              r={3.6}
              fill={COLORS.accent}
              stroke="#fff"
              strokeWidth="1"
              style={{
                filter: "drop-shadow(0 0 2.5px #f2994a77)"
              }}
            />
          )}
        </g>
      );
    }
  });

  // Helper: describe SVG arc path for performance ring
  function describeArc(cx, cy, r, startAngle, endAngle) {
    const toRad = (angle) => (angle - 90) * Math.PI / 180;
    const start = {
      x: cx + r * Math.cos(toRad(startAngle)),
      y: cy + r * Math.sin(toRad(startAngle)),
    };
    const end = {
      x: cx + r * Math.cos(toRad(endAngle)),
      y: cy + r * Math.sin(toRad(endAngle)),
    };
    const largeArc = endAngle - startAngle <= 180 ? "0" : "1";
    return [
      "M", start.x, start.y,
      "A", r, r, 0, largeArc, 1, end.x, end.y,
    ].join(" ");
  }

  // Decorative background rings
  const bgRings = [];
  for (let i = 0; i < zoneRings; ++i) {
    bgRings.push(
      <circle
        key={`bgring-${i}`}
        cx={center}
        cy={center}
        r={startRadius + i * ringRadiusStep}
        fill="none"
        stroke={COLORS.ringStroke}
        strokeWidth="1.2"
      />
    );
  }

  // Optional: add legend
  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 34,
      width: "100%",
      minHeight: SIZE,
      overflow: "auto"
    }}>
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        tabIndex={0}
        role="img"
        aria-label="HVAC building temperature and status map"
        style={{
          outline: "none",
          background: "#fff",
          borderRadius: "50%",
          boxShadow: "0 2px 13px rgba(180, 212, 240,0.09)",
          border: `1.5px solid ${COLORS.gridBorder}`,
        }}
      >
        {/* Decorative back rings */}
        {bgRings}
        {/* Zone glyphs */}
        {sectors}
        {/* Circular center label */}
        <circle
          cx={center}
          cy={center}
          r={34}
          fill={COLORS.primary}
          opacity={0.07}
        />
        <text
          x={center} y={center - 2}
          textAnchor="middle"
          fontSize="23"
          fill={COLORS.primary}
          fontWeight={900}
        >HVAC</text>
        <text
          x={center}
          y={center + 18}
          textAnchor="middle"
          fontSize="9"
          fill="#999"
        >Building</text>
      </svg>
      {/* Legend */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        marginLeft: "1.8rem",
        justifyContent: "center",
        fontSize: "13.2px",
        color: "#767676"
      }}>
        <div style={{ marginBottom: 7 }}>
          <span style={{ display: "inline-block", width: 13, height: 8, borderRadius: 1, background: COLORS.primary, marginRight: 5 }} /> Cool/low temp
        </div>
        <div style={{ marginBottom: 7 }}>
          <span style={{ display: "inline-block", width: 13, height: 8, borderRadius: 1, background: COLORS.secondary, marginRight: 5 }} /> Good/neutral
        </div>
        <div style={{ marginBottom: 7 }}>
          <span style={{ display: "inline-block", width: 13, height: 8, borderRadius: 1, background: COLORS.accent, marginRight: 5 }} /> Hot/high, {`<50%`} perf
        </div>
        <div>
          <span style={{
            display: "inline-block",
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: COLORS.accent,
            border: "1.5px solid #fff",
            marginRight: 4
          }} /> Underperforming
        </div>
      </div>
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
      <span style={{ fontSize: 13, color: "#999" }}>({ZONES_COUNT} total zones)</span>
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
      <h3 style={{ marginTop: 0, color: COLORS.primary }}>{zone.name} ({zone.room})</h3>
      <div>
        <span style={{ fontWeight: 600 }}>Temp:</span>{" "}
        <span style={{ fontWeight: 700, color: COLORS.accent, fontSize: 22 }}>
          {zone.temperature.toFixed(1)}°C
        </span>
      </div>
      <div>
        <span style={{ fontWeight: 600 }}>HVAC Performance:</span>{" "}
        <span style={{ fontWeight: 700, color: perfColor, fontSize: 20 }}>
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
  const [filter, setFilter] = useState("");
  const [selectedZone, setSelectedZone] = useState(null);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setZones(oldZones => randomizeZones(oldZones));
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  // Filtering logic
  const filteredZones = useMemo(() => {
    if (!filter) return zones;
    const term = filter.toLowerCase();
    return zones.filter(
      z =>
        z.name.toLowerCase().includes(term) ||
        z.room.toLowerCase().includes(term)
    );
  }, [zones, filter]);

  const currentSelectedZone = useMemo(
    () => zones.find((z) => z.id === selectedZone),
    [selectedZone, zones]
  );

  // Keyboard event for ESC to close expanded card
  useEffect(() => {
    if (!selectedZone) return;
    function handler(e) {
      if (e.key === "Escape") setSelectedZone(null);
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedZone]);

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
      <ZoneRadialDashboard
        zones={filteredZones}
        onSelect={setSelectedZone}
        selectedZoneId={selectedZone}
      />
      <ZoneDetails zone={currentSelectedZone} onClose={() => setSelectedZone(null)} />
    </main>
  );
}

export default Dashboard;

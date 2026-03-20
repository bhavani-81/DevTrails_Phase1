import React, { useState, useEffect, useRef } from "react";

export default function App() {
  const [score, setScore] = useState(null);
  const [status, setStatus] = useState("");
  const [event, setEvent] = useState("Flood Alert · Chennai");
  const [fraud, setFraud] = useState("");
  const [history, setHistory] = useState([]);
  const [fraudRingCounter, setFraudRingCounter] = useState(0);
  const [burstScore, setBurstScore] = useState(0);
  const [cohortAlert, setCohortAlert] = useState("None");
  const [gpsVariance, setGpsVariance] = useState("—");
  
  const chartRef = useRef(null);
  const [fraudDataPoints, setFraudDataPoints] = useState([0.12, 0.09, 0.18, 0.22, 0.15]);

  const [inputs, setInputs] = useState({
    motion: true,
    network: true,
    recentOrder: true,
    mockGPS: false,
    baroMatch: true,
    ambientNoise: true,
  });

  const handleToggle = (key) => {
    setInputs({ ...inputs, [key]: !inputs[key] });
  };

  const computeMSTS = () => {
    let s = 0.0;
    if (inputs.motion) s += 0.22;
    if (inputs.network) s += 0.15;
    if (inputs.recentOrder) s += 0.18;
    if (!inputs.mockGPS) s += 0.25;
    if (inputs.baroMatch) s += 0.12;
    if (inputs.ambientNoise) s += 0.08;
    if (inputs.mockGPS) s = Math.max(0, s - 0.45);
    s = Math.min(1.0, Math.max(0.05, s));
    return Number(s.toFixed(2));
  };

  const evaluateClaim = (scoreVal, eventName) => {
    let resultText = "";
    let payoutAmount = 0;
    if (scoreVal >= 0.72) {
      resultText = "✅ AUTO-APPROVED · income protection credited";
      payoutAmount = Math.floor(Math.random() * (420 - 180 + 1) + 180);
    } else if (scoreVal >= 0.45) {
      resultText = "⚠️ SOFT HOLD · 24hr assisted verification needed";
      payoutAmount = 0;
    } else {
      resultText = "❌ HARD BLOCK · fraud investigation initiated";
      payoutAmount = 0;
    }
    return { resultText, payoutAmount };
  };

  const updateRingAnalytics = (wasFraudSim = false, currentScore = null) => {
    let burstVal = fraudRingCounter > 2 ? Math.min(0.95, 0.5 + fraudRingCounter * 0.12) : (Math.random() * 0.3);
    if (wasFraudSim) burstVal = Math.min(0.98, burstVal + 0.45);
    setBurstScore(Number(burstVal.toFixed(2)));
    
    if (burstVal > 0.7) setCohortAlert("🚨 High risk cluster (GPS cluster)");
    else if (burstVal > 0.35) setCohortAlert("⚠️ Moderate deviation");
    else setCohortAlert("✅ Normal patterns");
    
    let variance = (Math.random() * 180 + 20).toFixed(0);
    if (wasFraudSim) variance = (Math.random() * 30 + 5).toFixed(0);
    setGpsVariance(`${variance}m`);
    
    setFraudDataPoints(prev => [...prev.slice(1), burstVal]);
  };

  const submitClaim = () => {
    const msts = computeMSTS();
    setScore(msts);
    
    const { resultText, payoutAmount } = evaluateClaim(msts, event);
    setStatus(resultText);
    
    let fraudMsg = "";
    if (msts < 0.45 || inputs.mockGPS) {
      fraudMsg = "⚠️ Anomaly: GPS spoofing pattern detected + inconsistent sensor coherence. Claim blocked.";
    } else if (msts >= 0.72) {
      fraudMsg = "✅ Clean telemetry · cross-validation passed";
    } else {
      fraudMsg = "🔍 Additional location verification required (photo/voice)";
    }
    setFraud(fraudMsg);
    
    const shortResult = resultText.split("·")[0];
    setHistory(prev => [{ event: event.split("·")[0], score: msts, result: shortResult }, ...prev].slice(0, 6));
    
    updateRingAnalytics(false, msts);
  };

  const fraudRingAttack = () => {
    setFraudRingCounter(prev => prev + 1);
    
    setInputs({
      motion: false,
      network: false,
      recentOrder: false,
      mockGPS: true,
      baroMatch: false,
      ambientNoise: false,
    });
    
    const msts = computeMSTS();
    setScore(msts);
    
    setStatus("❌ HARD BLOCK · fraud investigation initiated [FRAUD RING FLAG]");
    setFraud("🚨 COORDINATED FRAUD RING DETECTED: GPS spoofing cluster + burst claims from same device cohort. Liquidity circuit breaker activated.");
    
    setHistory(prev => [{ event: event.split("·")[0] + " (🚨 ring)", score: msts, result: "BLOCKED · Fraud syndicate" }, ...prev].slice(0, 6));
    
    updateRingAnalytics(true, msts);
    setBurstScore(0.94);
    setCohortAlert("🚨 Active syndicate (Telegram coordinated)");
  };

  useEffect(() => {
    if (chartRef.current && window.Chart) {
      const ctx = chartRef.current.getContext('2d');
      if (chartRef.current.chart) {
        chartRef.current.chart.destroy();
      }
      chartRef.current.chart = new window.Chart(ctx, {
        type: 'line',
        data: {
          labels: ['t-4', 't-3', 't-2', 't-1', 'now'],
          datasets: [{
            label: 'Ring risk index',
            data: fraudDataPoints,
            borderColor: '#0891b2',
            backgroundColor: 'rgba(8, 145, 178, 0.1)',
            tension: 0.3,
            fill: true,
            pointBackgroundColor: '#06b6d4'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: { legend: { labels: { color: '#475569', font: { size: 10 } } } },
          scales: { y: { min: 0, max: 1, grid: { color: '#e2e8f0' } }, x: { ticks: { color: '#64748b' } } }
        }
      });
    }
  }, [fraudDataPoints]);

  const getScoreColor = () => {
    if (score === null) return "#0891b2";
    if (score >= 0.72) return "#10b981";
    if (score >= 0.45) return "#f59e0b";
    return "#ef4444";
  };

  const getScoreOffset = () => {
    if (score === null) return 264;
    return 264 * (1 - Math.min(1, Math.max(0, score)));
  };

  const getPayoutDisplay = () => {
    if (status.includes("APPROVED")) {
      const amount = Math.floor(Math.random() * (420 - 180 + 1) + 180);
      return `✅ ₹${amount} credited to UPI`;
    }
    if (status.includes("HOLD")) return "⏳ No payout (hold/blocked)";
    if (status.includes("BLOCKED")) return "❌ Payout rejected · Ring detected";
    return "—";
  };

  // Light, refreshing weather theme colors
  const containerStyle = {
    background: "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 50%, #7dd3fc 100%)",
    color: "#0f172a",
    minHeight: "100vh",
    padding: "20px",
    fontFamily: "Arial, sans-serif"
  };

  const cardStyle = {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(10px)",
    borderRadius: "20px",
    padding: "24px",
    marginBottom: "20px",
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.02)",
    border: "1px solid rgba(255, 255, 255, 0.5)"
  };

  const buttonStyle = {
    padding: "12px 24px",
    border: "none",
    borderRadius: "12px",
    color: "white",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "600",
    marginRight: "12px",
    transition: "all 0.2s ease",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
  };

  const selectStyle = {
    backgroundColor: "#f8fafc",
    color: "#0f172a",
    padding: "10px 20px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer"
  };

  return (
    <div style={containerStyle}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", flexWrap: "wrap", gap: "15px" }}>
          <div>
            <h1 style={{ fontSize: "36px", margin: 0, fontWeight: "bold", background: "linear-gradient(135deg, #0f172a, #1e293b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              🛡️ ShieldPay
            </h1>
            <p style={{ color: "#334155", fontSize: "14px", marginTop: "5px" }}>AI parametric insurance · instant income protection for gig heroes</p>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <span style={{ backgroundColor: "#d9f99d", color: "#3f6212", padding: "6px 16px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" }}>🍱 Food delivery partner</span>
            <span style={{ backgroundColor: "#bae6fd", color: "#075985", padding: "6px 16px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" }}>Weekly premium: ₹59</span>
          </div>
        </div>

        {/* Event Card */}
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px" }}>
            <div>
              <h3 style={{ fontSize: "20px", margin: 0 }}>🌍 Active disruption event</h3>
              <p style={{ color: "#475569", fontSize: "14px", marginTop: "5px" }}>Parametric trigger · real-time weather / hazard alert</p>
            </div>
            <select value={event} onChange={(e) => setEvent(e.target.value)} style={selectStyle}>
              <option>🌊 Flood Alert · Chennai</option>
              <option>🌀 Cyclone Warning · Odisha Coast</option>
              <option>☔ Heavy Rain · Mumbai</option>
              <option>😷 Severe AQI · Delhi NCR</option>
              <option>🔥 Heatwave · Hyderabad</option>
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "15px", marginTop: "25px", textAlign: "center" }}>
            <div style={{ backgroundColor: "#f1f5f9", padding: "12px", borderRadius: "12px" }}>
              <div style={{ color: "#475569", fontSize: "12px", fontWeight: "500" }}>Active zones</div>
              <strong style={{ fontSize: "18px", color: "#0f172a" }}>12 sectors</strong>
            </div>
            <div style={{ backgroundColor: "#f1f5f9", padding: "12px", borderRadius: "12px" }}>
              <div style={{ color: "#475569", fontSize: "12px", fontWeight: "500" }}>Est. affected</div>
              <strong style={{ fontSize: "18px", color: "#0f172a" }}>2,300+ workers</strong>
            </div>
            <div style={{ backgroundColor: "#f1f5f9", padding: "12px", borderRadius: "12px" }}>
              <div style={{ color: "#475569", fontSize: "12px", fontWeight: "500" }}>Auto-trigger</div>
              <strong style={{ fontSize: "18px", color: "#10b981" }}>✅ Active</strong>
            </div>
            <div style={{ backgroundColor: "#f1f5f9", padding: "12px", borderRadius: "12px" }}>
              <div style={{ color: "#475569", fontSize: "12px", fontWeight: "500" }}>Loss multiplier</div>
              <strong style={{ fontSize: "18px", color: "#0f172a" }}>1.4x</strong>
            </div>
          </div>
        </div>

        {/* Telemetry Controls */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: "20px", margin: "0 0 15px 0" }}>🎛️ Multi-Signal Telemetry (MSTS)</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", marginTop: "15px" }}>
            {Object.keys(inputs).map((key) => (
              <label key={key} style={{ display: "flex", alignItems: "center", gap: "10px", backgroundColor: "#f8fafc", padding: "10px", borderRadius: "10px", cursor: "pointer" }}>
                <input type="checkbox" checked={inputs[key]} onChange={() => handleToggle(key)} style={{ width: "18px", height: "18px", cursor: "pointer" }} />
                <span style={{ fontSize: "14px", fontWeight: "500" }}>
                  {key === 'motion' && '🚴 Motion variance'}
                  {key === 'network' && '📡 Tower handoff'}
                  {key === 'recentOrder' && '🛵 Recent delivery'}
                  {key === 'mockGPS' && '⚠️ Mock location (spoof)'}
                  {key === 'baroMatch' && '🌡️ Baro match zone'}
                  {key === 'ambientNoise' && '🎙️ Rain/wind audio'}
                </span>
              </label>
            ))}
          </div>
          <div style={{ marginTop: "25px" }}>
            <button 
              onClick={submitClaim} 
              style={{ ...buttonStyle, backgroundColor: "#10b981" }}
              onMouseEnter={(e) => e.target.style.backgroundColor = "#059669"}
              onMouseLeave={(e) => e.target.style.backgroundColor = "#10b981"}
            >
              🚀 Simulate claim
            </button>
            <button 
              onClick={fraudRingAttack} 
              style={{ ...buttonStyle, backgroundColor: "#ef4444" }}
              onMouseEnter={(e) => e.target.style.backgroundColor = "#dc2626"}
              onMouseLeave={(e) => e.target.style.backgroundColor = "#ef4444"}
            >
              🚨 Simulate fraud ring attack
            </button>
          </div>
        </div>

        {/* MSTS Score */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: "20px", margin: "0 0 20px 0" }}>📊 Multi-Signal Trust Score</h3>
          <div style={{ display: "flex", alignItems: "center", gap: "30px", flexWrap: "wrap" }}>
            <div style={{ position: "relative", width: "140px", height: "140px" }}>
              <svg style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }} viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                <circle cx="50" cy="50" r="42" fill="none" stroke={getScoreColor()} strokeWidth="8" strokeDasharray="264" strokeDashoffset={getScoreOffset()} strokeLinecap="round" />
              </svg>
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", fontSize: "28px", fontWeight: "bold", color: "#0f172a" }}>
                {score !== null ? score.toFixed(2) : "0.00"}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ backgroundColor: "#f1f5f9", padding: "12px", borderRadius: "12px", marginBottom: "12px" }}>
                <span style={{ fontWeight: "500" }}>📌 Decision status: </span>
                <strong style={{ color: "#f59e0b" }}>{status || "— No claim yet"}</strong>
              </div>
              <div style={{ backgroundColor: "#f1f5f9", padding: "12px", borderRadius: "12px" }}>
                <span style={{ fontWeight: "500" }}>⚡ Payout simulation: </span>
                <strong style={{ color: "#10b981" }}>{getPayoutDisplay()}</strong>
              </div>
              {fraud && (
                <div style={{ backgroundColor: "#fee2e2", border: "1px solid #fecaca", padding: "12px", borderRadius: "12px", marginTop: "12px" }}>
                  <span style={{ color: "#dc2626", fontWeight: "600" }}>🧠 Fraud detection engine:</span>
                  <span style={{ marginLeft: "8px", color: "#991b1b" }}>{fraud}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* History */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: "20px", margin: "0 0 15px 0" }}>📜 Claim History</h3>
          {history.length === 0 ? (
            <p style={{ color: "#64748b", textAlign: "center", padding: "20px" }}>No claims submitted yet</p>
          ) : (
            history.map((item, idx) => (
              <div key={idx} style={{ backgroundColor: "#f8fafc", padding: "12px", borderRadius: "10px", marginBottom: "10px", border: "1px solid #e2e8f0" }}>
                <strong>{item.event}</strong> → Score: {item.score} → {item.result}
              </div>
            ))
          )}
        </div>

        {/* Ring Detection */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: "20px", margin: "0 0 15px 0" }}>🧩 Ring Detection Engine</h3>
          <div style={{ backgroundColor: "#f8fafc", padding: "15px", borderRadius: "12px", marginBottom: "15px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
              <span style={{ fontWeight: "500" }}>📊 Coordinated burst score:</span>
              <strong style={{ color: "#0891b2" }}>{burstScore.toFixed(2)}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
              <span style={{ fontWeight: "500" }}>👥 Suspicious cohort:</span>
              <strong style={{ color: "#f59e0b" }}>{cohortAlert}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontWeight: "500" }}>📍 GPS variance (m):</span>
              <strong>{gpsVariance}</strong>
            </div>
          </div>
          <canvas ref={chartRef} style={{ marginTop: "15px", height: "130px", width: "100%" }}></canvas>
        </div>

        {/* Footer Note */}
        <div style={{ textAlign: "center", marginTop: "20px", padding: "15px", color: "#334155", fontSize: "12px" }}>
          ⚡ Parametric coverage: income loss due to weather, floods, AQI, curfews | Weekly pricing model (₹49–₹99) | MSTS anti-spoof + location cross-validation
        </div>
      </div>
    </div>
  );
}
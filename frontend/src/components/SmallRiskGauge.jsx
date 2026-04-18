import React from "react";
import GaugeChart from "react-gauge-chart";

/**
 * SmallRiskGauge Component
 * A compact speedometer gauge to visualize the session risk level.
 */
const SmallRiskGauge = ({ risk = "LOW" }) => {

  const getValue = () => {
    if (risk === "LOW") return 0.25;
    if (risk === "MEDIUM") return 0.6;
    if (risk === "HIGH") return 0.9;
    return 0.1; // Default
  };

  const getColor = () => {
    if (risk === "LOW") return "#22c55e";
    if (risk === "MEDIUM") return "#f59e0b";
    return "#ef4444";
  };

  return (
    <div style={{ width: "140px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <GaugeChart
        id="small-risk-gauge"
        nrOfLevels={3}
        percent={getValue()}
        colors={["#22c55e", "#f59e0b", "#ef4444"]}
        arcWidth={0.25}
        animate={true}
        textColor="transparent" // hides default %
        needleColor="#94a3b8"
        needleBaseColor="#94a3b8"
      />

      <div style={{ 
        marginTop: "-15px", 
        fontSize: "12px", 
        fontWeight: "bold",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        color: getColor()
      }}>
        {risk} Risk
      </div>
    </div>
  );
};

export default SmallRiskGauge;

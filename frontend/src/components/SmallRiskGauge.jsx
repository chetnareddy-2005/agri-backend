import React from "react";
import GaugeChart from "react-gauge-chart";

const SmallRiskGauge = ({ risk }) => {

  const getValue = () => {
    if (risk === "LOW") return 0.25;
    if (risk === "MEDIUM") return 0.6;
    return 0.9;
  };

  return (
    <div style={{ width: "120px", textAlign: "center", display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <GaugeChart
        id="small-risk-gauge"
        nrOfLevels={3}
        percent={getValue()}
        colors={["#22c55e", "#f59e0b", "#ef4444"]}
        arcWidth={0.25}
        animate={true}
        textColor="transparent"
        needleColor="#94a3b8"
        needleBaseColor="#64748b"
        style={{ width: '100%' }}
      />
      <div style={{ 
        marginTop: "-15px", 
        fontSize: "10px", 
        fontWeight: "900",
        letterSpacing: '0.5px',
        color:
          risk === "LOW" ? "#22c55e" :
          risk === "MEDIUM" ? "#f59e0b" : "#ef4444",
        textTransform: 'uppercase'
      }}>
        {risk} RISK
      </div>
    </div>
  );
};

export default SmallRiskGauge;

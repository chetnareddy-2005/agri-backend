import React from "react";

const RiskMeter = ({ risk }) => {
  const getColor = () => {
    if (risk === "LOW") return "green";
    if (risk === "MEDIUM") return "orange";
    return "red";
  };

  return (
    <div style={{ textAlign: "center", marginTop: "20px" }}>
      <h3>Risk Level</h3>

      <div
        style={{
          width: "200px",
          height: "20px",
          background: "#eee",
          borderRadius: "10px",
          overflow: "hidden",
          margin: "auto",
        }}
      >
        <div
          style={{
            width:
              risk === "LOW" ? "33%" :
              risk === "MEDIUM" ? "66%" : "100%",
            height: "100%",
            background: getColor(),
            transition: "0.5s"
          }}
        />
      </div>

      <p style={{ color: getColor(), fontWeight: "bold" }}>
        {risk}
      </p>
    </div>
  );
};

export default RiskMeter;

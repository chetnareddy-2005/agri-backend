package com.farmerretailer.gemini.dto;

public class SecurityAnalysisRequest {
    private Double typingSpeedWpm;
    private Double mouseMovementAvgSpeed;
    private Integer scrollFrequency;
    private String ipAddress;
    private Double riskScore;

    public Double getTypingSpeedWpm() { return typingSpeedWpm; }
    public void setTypingSpeedWpm(Double typingSpeedWpm) { this.typingSpeedWpm = typingSpeedWpm; }

    public Double getMouseMovementAvgSpeed() { return mouseMovementAvgSpeed; }
    public void setMouseMovementAvgSpeed(Double mouseMovementAvgSpeed) { this.mouseMovementAvgSpeed = mouseMovementAvgSpeed; }

    public Integer getScrollFrequency() { return scrollFrequency; }
    public void setScrollFrequency(Integer scrollFrequency) { this.scrollFrequency = scrollFrequency; }

    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }

    public Double getRiskScore() { return riskScore; }
    public void setRiskScore(Double riskScore) { this.riskScore = riskScore; }
}

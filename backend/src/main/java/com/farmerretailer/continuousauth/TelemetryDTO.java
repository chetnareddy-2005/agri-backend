package com.farmerretailer.continuousauth;

public class TelemetryDTO {
    private Double typingSpeedWpm;
    private Double mouseMovementAvgSpeed;
    private Integer scrollFrequency;

    public Double getTypingSpeedWpm() { return typingSpeedWpm; }
    public void setTypingSpeedWpm(Double typingSpeedWpm) { this.typingSpeedWpm = typingSpeedWpm; }

    public Double getMouseMovementAvgSpeed() { return mouseMovementAvgSpeed; }
    public void setMouseMovementAvgSpeed(Double mouseMovementAvgSpeed) { this.mouseMovementAvgSpeed = mouseMovementAvgSpeed; }

    public Integer getScrollFrequency() { return scrollFrequency; }
    public void setScrollFrequency(Integer scrollFrequency) { this.scrollFrequency = scrollFrequency; }
}

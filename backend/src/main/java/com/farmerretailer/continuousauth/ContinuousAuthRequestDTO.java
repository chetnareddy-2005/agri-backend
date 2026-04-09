package com.farmerretailer.continuousauth;

public class ContinuousAuthRequestDTO {
    private String userId;
    private String deviceFingerprint;
    private String ipAddress;
    private TelemetryDTO telemetry;

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getDeviceFingerprint() { return deviceFingerprint; }
    public void setDeviceFingerprint(String deviceFingerprint) { this.deviceFingerprint = deviceFingerprint; }

    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }

    public TelemetryDTO getTelemetry() { return telemetry; }
    public void setTelemetry(TelemetryDTO telemetry) { this.telemetry = telemetry; }
}

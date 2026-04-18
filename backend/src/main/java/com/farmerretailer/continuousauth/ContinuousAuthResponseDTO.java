package com.farmerretailer.continuousauth;

public class ContinuousAuthResponseDTO {
    private String userId;
    private String riskLevel;
    private Double score;
    private int anomalyCount;

    public ContinuousAuthResponseDTO() {}

    public ContinuousAuthResponseDTO(String userId, String riskLevel, Double score, int anomalyCount) {
        this.userId = userId;
        this.riskLevel = riskLevel;
        this.score = score;
        this.anomalyCount = anomalyCount;
    }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }

    public Double getScore() { return score; }
    public void setScore(Double score) { this.score = score; }

    public int getAnomalyCount() { return anomalyCount; }
    public void setAnomalyCount(int anomalyCount) { this.anomalyCount = anomalyCount; }
}

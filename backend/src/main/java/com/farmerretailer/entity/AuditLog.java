package com.farmerretailer.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "audit_log")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String userId;
    private String riskLevel;
    private String action;
    private long timestamp;

    public AuditLog() {}

    public AuditLog(String userId, String riskLevel, String action) {
        this.userId = userId;
        this.riskLevel = riskLevel;
        this.action = action;
        this.timestamp = System.currentTimeMillis();
    }

    public Long getId() { return id; }
    public String getUserId() { return userId; }
    public String getRiskLevel() { return riskLevel; }
    public String getAction() { return action; }
    public long getTimestamp() { return timestamp; }
}

package com.farmerretailer.service;

import com.farmerretailer.entity.Driver;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AllocationService {

    @Autowired
    private TransportService transportService;
    
    @Autowired
    private CrisisService crisisService;

    public Map<String, Object> calculateAllocationScore(Driver driver, String source, String destination, String weatherCondition) {
        double efficiencyScore = 0;
        double fairnessScore = 0;
        
        // 1. Efficiency Weight: Rating (Max 50 points)
        efficiencyScore += ((driver.getRating() != null ? driver.getRating() : 4.0) / 5.0) * 50;
        
        // 2. Weather Risk (Crisis Module Integration)
        String riskLevel = crisisService.resolveRiskLevel(source);
        if ("HIGH RISK".equals(riskLevel) && driver.getVehicleType().toLowerCase().contains("bike")) {
            efficiencyScore -= 30; // Deduct for unsafe vehicle in high-risk zone
        }

        // 3. Fairness Weight: Rotation-based (Inverse of workload)
        // More delivered requests => lower fairness score to rotate jobs
        int currentWorkload = driver.getDeliveredRequests() != null ? driver.getDeliveredRequests() : 0;
        fairnessScore = Math.max(0, 50 - (currentWorkload * 2)); 
        
        double totalScore = (efficiencyScore * 0.7) + (fairnessScore * 0.3);
        
        Map<String, Object> result = new HashMap<>();
        result.put("driverId", driver.getId());
        result.put("driverName", driver.getUser() != null ? driver.getUser().getFullName() : "Driver " + driver.getId());
        result.put("score", Math.round(totalScore));
        result.put("efficiency", Math.round(efficiencyScore));
        result.put("fairness", Math.round(fairnessScore));
        result.put("risk", riskLevel);
        result.put("vehicle", driver.getVehicleType());
        result.put("isRecommended", totalScore > 65);
        result.put("badge", totalScore > 80 ? "🏆 Premium Optimized" : totalScore > 60 ? "✅ Fair Choice" : "🔍 Standard");
        result.put("explanation", generateFairnessExplanation(efficiencyScore, fairnessScore));
        
        return result;
    }

    public List<Map<String, Object>> getOptimizedAssignments(String destination) {
        // AI Clustering Logic: Group transporters in the area
        List<Driver> allDrivers = transportService.getAllTransporters().stream()
                .filter(Driver::isAvailable)
                .collect(Collectors.toList());
        
        List<Map<String, Object>> assignments = allDrivers.stream()
                .map(d -> calculateAllocationScore(d, "Current Location", destination, "Clear"))
                .collect(Collectors.toList());

        // Presentation Mode: Add mock drivers if database is empty
        if (assignments.isEmpty()) {
            assignments.add(createMockAssignment(101L, "Rahul Sharma", 88, 92, 75, "Auto-Rickshaw", "SAFE", "🥇 Efficiency Leader"));
            assignments.add(createMockAssignment(102L, "Suresh Kumar", 72, 65, 88, "Tata Ace (Truck)", "SAFE", "⚖️ Fairness Pick"));
        }
                
        return assignments.stream()
                .sorted((a, b) -> Double.compare(Double.valueOf(b.get("score").toString()), Double.valueOf(a.get("score").toString())))
                .collect(Collectors.toList());
    }

    private Map<String, Object> createMockAssignment(Long id, String name, int score, int eff, int fair, String vehicle, String risk, String badge) {
        Map<String, Object> m = new HashMap<>();
        m.put("driverId", id);
        m.put("driverName", name + " (AI Partner)");
        m.put("score", score);
        m.put("efficiency", eff);
        m.put("fairness", fair);
        m.put("risk", risk);
        m.put("vehicle", vehicle);
        m.put("badge", badge);
        m.put("isRecommended", score > 80);
        m.put("explanation", "Simulated driver for marketplace demonstration.");
        return m;
    }

    private String generateFairnessExplanation(double eff, double fair) {
        if (fair > 40) {
            return "📣 Selected to balance marketplace rotation and give more drivers a chance.";
        }
        return "⚡ High-efficiency match based on stellar historical performance and safety.";
    }
}

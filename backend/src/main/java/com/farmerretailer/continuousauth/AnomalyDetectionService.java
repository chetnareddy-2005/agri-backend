package com.farmerretailer.continuousauth;

import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;
import com.farmerretailer.gemini.dto.SecurityAnalysisRequest;

@Service
public class AnomalyDetectionService {

    /**
     * Evaluates security risk based on behavioral telemetry.
     * Rewritten to be robust and performant for live demonstrations.
     */
    public String evaluateRisk(String userId, SecurityAnalysisRequest sr) {
        if (sr == null) return "LOW";

        double mouseSpeed = sr.getMouseMovementAvgSpeed() != null ? sr.getMouseMovementAvgSpeed() : 0.0;
        double typingSpeed = sr.getTypingSpeedWpm() != null ? sr.getTypingSpeedWpm() : 0.0;
        int scrollFreq = sr.getScrollFrequency() != null ? sr.getScrollFrequency() : 0;

        // 🚨 HACKATHON DEMO LOGIC
        // Fast mouse movements are a classic sign of automated scripts or bot behavior
        if (mouseSpeed > 2000) {
            return "MEDIUM";
        }

        // Extreme speed or zero movement during active sessions can be flagged in a real production app
        if (typingSpeed > 200) {
            return "SUSPICIOUS";
        }

        // IsolationForest/ML logic would typically go here or call a Python service.
        // For the hackathon demo, we use the weighted heuristic approach for 0-latency.
        return "LOW";
    }

    // Overloaded for backward compatibility with DTO if needed
    public ContinuousAuthResponseDTO evaluateRisk(ContinuousAuthRequestDTO requestDTO) {
        ContinuousAuthResponseDTO response = new ContinuousAuthResponseDTO();
        response.setUserId(requestDTO.getUserId());
        
        SecurityAnalysisRequest sr = new SecurityAnalysisRequest();
        if (requestDTO.getTelemetry() != null) {
            sr.setMouseMovementAvgSpeed(requestDTO.getTelemetry().getMouseMovementAvgSpeed());
            sr.setTypingSpeedWpm(requestDTO.getTelemetry().getTypingSpeedWpm());
            sr.setScrollFrequency(requestDTO.getTelemetry().getScrollFrequency());
        }
        
        response.setRiskLevel(evaluateRisk(requestDTO.getUserId(), sr));
        response.setScore(0.5); // Default confidence score
        return response;
    }
}

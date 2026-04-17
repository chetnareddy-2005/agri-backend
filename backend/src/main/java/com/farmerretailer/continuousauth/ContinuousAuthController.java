package com.farmerretailer.continuousauth;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;

import java.util.Map;
import java.util.HashMap;

import java.util.concurrent.ConcurrentHashMap;
import com.farmerretailer.service.EmailService;
import com.farmerretailer.gemini.GeminiAIService;
import com.farmerretailer.gemini.dto.SecurityAnalysisRequest;
import com.farmerretailer.repository.AuditLogRepository;
import com.farmerretailer.entity.AuditLog;

@RestController
@RequestMapping("/api/v1/telemetry")
@CrossOrigin(origins = "*")
public class ContinuousAuthController {

    @Autowired
    private AnomalyDetectionService anomalyDetectionService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private GeminiAIService geminiAIService;

    @Autowired
    private AuditLogRepository auditLogRepository;

    public static class OtpData {
        private String otp;
        private long expiryTime;
        private int attempts;

        public OtpData(String otp, long expiryTime) {
            this.otp = otp;
            this.expiryTime = expiryTime;
            this.attempts = 0;
        }

        public String getOtp() { return otp; }
        public long getExpiryTime() { return expiryTime; }
        public int getAttempts() { return attempts; }

        public void incrementAttempts() {
            this.attempts++;
        }
    }

    // Temporary storage for OTPs now using OtpData structure
    private final ConcurrentHashMap<String, OtpData> otpStorage = new ConcurrentHashMap<>();
    
    // Quick cache for user's last telemetry so Gemini has context
    private final Map<String, ContinuousAuthRequestDTO> lastTelemetryCache = new ConcurrentHashMap<>();

    private String generateOtp() {
        return String.valueOf((int)(Math.random() * 900000) + 100000);
    }

    @PostMapping("/evaluate")
    public ResponseEntity<?> evaluateTelemetry(@RequestBody ContinuousAuthRequestDTO requestDTO) {
        try {
            if (requestDTO == null || requestDTO.getTelemetry() == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid metrics data"));
            }

            ContinuousAuthResponseDTO response = anomalyDetectionService.evaluateRisk(requestDTO);
            String userId = requestDTO.getUserId();

            // Guard against null response
            if (response == null) {
                response = new ContinuousAuthResponseDTO();
                response.setUserId(userId);
                response.setRiskLevel("LOW");
                response.setScore(0.0);
            }

            // Forced via Hackathon Logic (Mouse shake)
            Double mouseSpeed = requestDTO.getTelemetry().getMouseMovementAvgSpeed();
            if (mouseSpeed != null && mouseSpeed > 1000) {
                response.setRiskLevel("MEDIUM");
                System.out.println("Risk (Forced via Hackathon Logic): MEDIUM");
            }

            String currentRisk = response.getRiskLevel() != null ? response.getRiskLevel() : "LOW";
            
            switch(currentRisk) {
                case "HIGH":
                    try { auditLogRepository.save(new AuditLog(userId, "HIGH", "BLOCKED")); } catch(Exception e) {}
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Session terminated due to high risk behavior."));
                    
                case "MEDIUM":
                    try { auditLogRepository.save(new AuditLog(userId, "MEDIUM", "OTP_REQUIRED")); } catch(Exception e) {}
                    String otp = generateOtp();
                    long expiryTime = System.currentTimeMillis() + (5 * 60 * 1000);
                    
                    otpStorage.put(userId != null ? userId : "anonymous", new OtpData(otp, expiryTime));
                    lastTelemetryCache.put(userId != null ? userId : "anonymous", requestDTO);
                    
                    String targetEmail = (userId != null && userId.contains("@")) ? userId : "farmer_bob@farm2trade.com";
                    try { emailService.sendOtpEmail(targetEmail, otp); } catch(Exception e) {}
                    
                    System.out.println("🚨 OTP REQUIRED FOR: " + targetEmail + " -> " + otp);
                    
                    Map<String, String> mediumRiskBody = new HashMap<>();
                    mediumRiskBody.put("challenge", "OTP_REQUIRED");
                    mediumRiskBody.put("otp", otp); 
                    mediumRiskBody.put("message", "Suspicious activity detected. OTP sent to your email.");
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(mediumRiskBody);
                    
                case "LOW":
                default:
                    return ResponseEntity.ok(response);
            }
        } catch (Exception e) {
            System.err.println("CRITICAL ERROR IN TELEMETRY EVALUATION: " + e.getMessage());
            e.printStackTrace();
            // Return a safe but restricted response instead of 500
            return ResponseEntity.status(HttpStatus.OK).body(Map.of("riskLevel", "LOW", "score", 0.0, "note", "System degraded"));
        }
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> req) {
        String userId = req.get("userId");
        String enteredOtp = req.get("otp");

        OtpData data = otpStorage.get(userId);

        if (data == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "No OTP found"));
        }

        // Expiry check
        if (System.currentTimeMillis() > data.getExpiryTime()) {
            otpStorage.remove(userId);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "OTP expired"));
        }

        // Retry limit (max 3)
        if (data.getAttempts() >= 3) {
            otpStorage.remove(userId);
            auditLogRepository.save(new AuditLog(userId, "HIGH", "BLOCKED_MAX_RETRIES"));
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Too many attempts"));
        }

        // Validate OTP
        if (!data.getOtp().equals(enteredOtp)) {
            data.incrementAttempts();
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid OTP"));
        }

        // Success
        auditLogRepository.save(new AuditLog(userId, "MEDIUM", "OTP_VERIFIED"));
        otpStorage.remove(userId);
        
        ContinuousAuthRequestDTO lastReq = lastTelemetryCache.remove(userId);
        
        String explanation = "Verified successfully.";
        if (lastReq != null) {
            SecurityAnalysisRequest sr = new SecurityAnalysisRequest();
            sr.setTypingSpeedWpm(lastReq.getTelemetry().getTypingSpeedWpm());
            sr.setMouseMovementAvgSpeed(lastReq.getTelemetry().getMouseMovementAvgSpeed());
            sr.setScrollFrequency(lastReq.getTelemetry().getScrollFrequency());
            sr.setIpAddress("127.0.0.1 (Frontend)");
            sr.setRiskScore(-0.05); // It triggered MEDIUM
            
            explanation = geminiAIService.analyzeSecurity(sr);
        }
        
        Map<String, String> successResponse = new HashMap<>();
        successResponse.put("status", "VERIFIED");
        successResponse.put("geminiExplanation", explanation);
        return ResponseEntity.ok(successResponse);
    }
}

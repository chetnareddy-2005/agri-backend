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
                return ResponseEntity.ok(Map.of("riskLevel", "LOW", "score", 0.0));
            }

            ContinuousAuthResponseDTO response = null;
            try {
                response = anomalyDetectionService.evaluateRisk(requestDTO);
            } catch (Exception e) {
                System.err.println("Anomaly service failed: " + e.getMessage());
            }

            String userId = requestDTO.getUserId();
            if (userId == null) userId = "anonymous";

            if (response == null) {
                response = new ContinuousAuthResponseDTO();
                response.setUserId(userId);
            SecurityAnalysisRequest sr = new SecurityAnalysisRequest();
            sr.setTypingSpeedWpm(requestDTO.getTelemetry().getTypingSpeedWpm());
            sr.setMouseMovementAvgSpeed(requestDTO.getTelemetry().getMouseMovementAvgSpeed());
            sr.setScrollFrequency(requestDTO.getTelemetry().getScrollFrequency());
            sr.setIpAddress("User");

            // STEP 1: Fast Anomaly Detection (IsolationForest - Local/Fast)
            String currentRisk = anomalyDetectionService.evaluateRisk(userId, sr);
            
            // STEP 2: Conditional AI Analysis (ONLY for potential threats to save performance)
            String geminiInsight = "Behavioral patterns within normal parameters.";
            if (!"LOW".equals(currentRisk)) {
                try {
                    geminiInsight = geminiAIService.analyzeSecurity(sr);
                } catch (Exception e) {
                    geminiInsight = "Anomaly detected. Investigation recommended.";
                }
            }

            if ("HIGH".equals(currentRisk)) {
                try { auditLogRepository.save(new AuditLog(userId, "HIGH", "PROTECTED_TERMINATED")); } catch(Exception e) {}
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Security threshold exceeded."));
            } 

            if ("MEDIUM".equals(currentRisk) || "OTP_REQUIRED".equals(currentRisk)) {
                String otp = String.format("%06d", new java.util.Random().nextInt(999999));
                long expiry = System.currentTimeMillis() + (5 * 60 * 1000);
                otpStorage.put(userId, new OtpData(otp, expiry));
                lastTelemetryCache.put(userId, requestDTO);
                
                try {
                    emailService.sendOtpEmail(userId, otp);
                    auditLogRepository.save(new AuditLog(userId, "SUSPICIOUS", "OTP_CHALLENGE_ISSUED"));
                } catch(Exception e) {
                    System.err.println("Non-critical notification failure: " + e.getMessage());
                }

                Map<String, Object> challengeBody = new HashMap<>();
                challengeBody.put("challenge", "OTP_REQUIRED");
                challengeBody.put("otp", otp); 
                challengeBody.put("insight", geminiInsight);
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(challengeBody);
            }

            return ResponseEntity.ok(Map.of("status", "SECURE", "risk", currentRisk));
        } catch (Exception e) {
            System.err.println("FINAL FAIL-SAFE TRIGGERED: " + e.getMessage());
            return ResponseEntity.ok(Map.of("riskLevel", "LOW", "score", 0.0));
        }
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> req) {
        try {
            String userId = (req != null) ? req.get("userId") : null;
            if (userId == null) userId = "anonymous";
            
            String enteredOtp = (req != null) ? req.get("otp") : "";

            OtpData data = otpStorage.get(userId);

            if (data == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "No active security challenge found. Please refresh."));
            }

            // Expiry check (5 minutes)
            if (System.currentTimeMillis() > data.getExpiryTime()) {
                otpStorage.remove(userId);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Security code has expired."));
            }

            // Retry limit protection
            if (data.getAttempts() >= 5) {
                otpStorage.remove(userId);
                try { auditLogRepository.save(new AuditLog(userId, "HIGH", "BLOCKED_MAX_RETRIES")); } catch(Exception e) {}
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Too many attempts. Session locked."));
            }

            // Validate OTP
            if (!data.getOtp().equals(enteredOtp)) {
                data.incrementAttempts();
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid security code. Please check the code on your screen."));
            }

            // Success flow
            otpStorage.remove(userId);
            try { auditLogRepository.save(new AuditLog(userId, "MEDIUM", "OTP_VERIFIED")); } catch(Exception e) {}
            
            ContinuousAuthRequestDTO lastReq = lastTelemetryCache.remove(userId);
            String explanation = "Identity verified successfully. Behavioral pattern matching confirmed.";
            
            if (lastReq != null && lastReq.getTelemetry() != null) {
                try {
                    SecurityAnalysisRequest sr = new SecurityAnalysisRequest();
                    sr.setTypingSpeedWpm(lastReq.getTelemetry().getTypingSpeedWpm());
                    sr.setMouseMovementAvgSpeed(lastReq.getTelemetry().getMouseMovementAvgSpeed());
                    sr.setScrollFrequency(lastReq.getTelemetry().getScrollFrequency());
                    sr.setIpAddress("Authenticated User");
                    sr.setRiskScore(-0.05); 
                    
                    explanation = geminiAIService.analyzeSecurity(sr);
                } catch (Exception e) {
                    System.err.println("Gemini Analysis during verification failed: " + e.getMessage());
                }
            }
            
            Map<String, String> successResponse = new HashMap<>();
            successResponse.put("status", "VERIFIED");
            successResponse.put("geminiExplanation", explanation);
            return ResponseEntity.ok(successResponse);
        } catch (Exception e) {
            System.err.println("FAIL-SAFE TRIGGERED IN VERIFY-OTP: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Security verification failed. Please try again."));
        }
    }
}

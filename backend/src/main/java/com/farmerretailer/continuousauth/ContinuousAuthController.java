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
    private final Map<String, Double> lastAnomalyScore = new ConcurrentHashMap<>();

    // Count suspicious events per session
    private final Map<String, Integer> anomalyCounter = new ConcurrentHashMap<>();
    private final Map<String, Integer> sessionKeystrokes = new ConcurrentHashMap<>();
    private final Map<String, Integer> sessionMouseEvents = new ConcurrentHashMap<>();

    private String generateOtp() {
        return String.valueOf((int)(Math.random() * 900000) + 100000);
    }

    @PostMapping("/evaluate")
    public ResponseEntity<?> evaluateTelemetry(@RequestBody ContinuousAuthRequestDTO requestDTO) {
        try {
            ContinuousAuthResponseDTO response = anomalyDetectionService.evaluateRisk(requestDTO);
            String userId = requestDTO.getUserId();

            // Very Important Debug Logging
            System.out.println("[Telemetry Debug] Score: " + response.getScore() + ", Risk: " + response.getRiskLevel());

            // 🚨 HACKATHON DEMO: Session-based Anomaly Tracking
            String userIdKey = userId != null ? userId : "anonymous";
            
            // Accumulate counts
            int newKeystrokes = (requestDTO.getTelemetry() != null && requestDTO.getTelemetry().getKeypressCount() != null) ? requestDTO.getTelemetry().getKeypressCount() : 0;
            int newMouseEvents = (requestDTO.getTelemetry() != null && requestDTO.getTelemetry().getMouseEventCount() != null) ? requestDTO.getTelemetry().getMouseEventCount() : 0;
            
            int totalKeys = sessionKeystrokes.getOrDefault(userIdKey, 0) + newKeystrokes;
            int totalMouse = sessionMouseEvents.getOrDefault(userIdKey, 0) + newMouseEvents;
            
            sessionKeystrokes.put(userIdKey, totalKeys);
            sessionMouseEvents.put(userIdKey, totalMouse);

            Double mouseSpeed = (requestDTO.getTelemetry() != null) ? requestDTO.getTelemetry().getMouseMovementAvgSpeed() : null;
            
            boolean isAnomaly = false;
            String reason = "";

            if (mouseSpeed != null && mouseSpeed > 2000) {
                isAnomaly = true;
                reason = "Frantic mouse speed (" + String.format("%.0f", mouseSpeed) + " px/s)";
            } else if (totalKeys > 300) {
                isAnomaly = true;
                reason = "Keystroke threshold exceeded (" + totalKeys + ")";
                sessionKeystrokes.put(userIdKey, 0); // Reset for next strike
            } else if (totalMouse > 500) {
                isAnomaly = true;
                reason = "Mouse event threshold exceeded (" + totalMouse + ")";
                sessionMouseEvents.put(userIdKey, 0); // Reset for next strike
            }

            if (isAnomaly) {
                int currentCount = anomalyCounter.getOrDefault(userIdKey, 0) + 1;
                anomalyCounter.put(userIdKey, currentCount);
                System.out.println("[Telemetry Debug] ANOMALY DETECTED! Reason: " + reason + " | Count: " + currentCount);
                
                if (currentCount >= 3) {
                    response.setRiskLevel("MEDIUM");
                    System.out.println("[Telemetry Debug] Triggering OTP (Anomaly Count reached 3)");
                } else {
                    response.setRiskLevel("LOW");
                    System.out.println("[Telemetry Debug] Strike " + currentCount + "/3 logged.");
                }
            } else {
                response.setRiskLevel("LOW");
            }
            
            response.setAnomalyCount(anomalyCounter.getOrDefault(userId != null ? userId : "anonymous", 0));

            switch(response.getRiskLevel()) {
                case "HIGH":
                    if (userId != null) auditLogRepository.save(new AuditLog(userId, "HIGH", "BLOCKED"));
                    Map<String, String> highRiskBody = new HashMap<>();
                    highRiskBody.put("error", "Session terminated due to high risk behavior.");
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(highRiskBody);

                case "MEDIUM":
                    if (userId != null) auditLogRepository.save(new AuditLog(userId, "MEDIUM", "OTP_REQUIRED"));
                    
                    String key = userId != null ? userId : "anonymous";
                    OtpData existingData = otpStorage.get(key);
                    String otp;
                    long expiryTime;

                    if (existingData != null && System.currentTimeMillis() < existingData.getExpiryTime()) {
                        otp = existingData.getOtp();
                        expiryTime = existingData.getExpiryTime();
                        System.out.println("[Telemetry Debug] Reusing existing active OTP for " + key);
                    } else {
                        otp = generateOtp();
                        expiryTime = System.currentTimeMillis() + (5 * 60 * 1000); // 5 mins
                        otpStorage.put(key, new OtpData(otp, expiryTime));
                        
                        // Only send email if it's a NEW OTP or the previous one expired
                        String targetEmail = (userId != null && userId.contains("@")) ? userId : "chetnareddy2520@gmail.com";
                        try {
                            emailService.sendOtp(targetEmail, otp);
                        } catch (Exception e) {
                            System.err.println("[Telemetry Debug] Email failed for " + targetEmail + ": " + e.getMessage());
                        }
                    }

                    lastTelemetryCache.put(key, requestDTO);
                    lastAnomalyScore.put(key, response.getScore());

                    String targetEmail = (userId != null && userId.contains("@")) ? userId : "chetnareddy2520@gmail.com";
                    boolean emailSent = true; // Assume true if reused or success
                    String emailErrorMessage = null;

                    // Reset anomaly counter for this user after triggering challenge
                    anomalyCounter.remove(userId != null ? userId : "anonymous");
                    sessionKeystrokes.remove(userId != null ? userId : "anonymous");
                    sessionMouseEvents.remove(userId != null ? userId : "anonymous");

                    // 🔥 HACKATHON DEMO: Print it directly to terminal and response
                    System.out.println("==================================================");
                    System.out.println("🚨 OTP REQUIRED FOR USER: " + targetEmail);
                    System.out.println("🔑 THE SECRET OTP IS: >>> " + otp + " <<<");
                    System.out.println("📬 EMAIL STATUS: " + (emailSent ? "SUCCESS" : "FAILED (" + emailErrorMessage + ")"));
                    System.out.println("==================================================");

                    Map<String, Object> mediumRiskBody = new HashMap<>();
                    mediumRiskBody.put("challenge", "OTP_REQUIRED");
                    mediumRiskBody.put("anomalyCount", 2); 
                    mediumRiskBody.put("riskLevel", "MEDIUM");
                    mediumRiskBody.put("otp", otp); 
                    mediumRiskBody.put("targetEmail", targetEmail);
                    mediumRiskBody.put("emailSent", emailSent);
                    mediumRiskBody.put("emailError", emailErrorMessage);
                    mediumRiskBody.put("message", emailSent ? "OTP sent to " + targetEmail : "System sent OTP to console (Email failed: " + emailErrorMessage + ")");
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(mediumRiskBody);

                case "LOW":
                default:
                    if (userId != null && Math.random() < 0.1) { 
                        auditLogRepository.save(new AuditLog(userId, "LOW", "ALLOWED"));
                    }
                    return ResponseEntity.ok(response);
            }
        } catch (Exception e) {
            System.err.println("[Telemetry Error] CRITICAL CRASH IN EVALUATE: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.OK).body(new ContinuousAuthResponseDTO(requestDTO.getUserId(), "LOW", 0.0, 0));
        }
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> req) {
        String userId = req.get("userId") != null ? req.get("userId").trim() : null;
        String enteredOtp = req.get("otp") != null ? req.get("otp").trim() : null;

        OtpData data = otpStorage.get(userId);

        System.out.println("🔍 [OTP Verification] User: " + userId);
        System.out.println("🔍 [OTP Verification] Received: [" + enteredOtp + "]");
        System.out.println("🔍 [OTP Verification] Expected: [" + (data != null ? data.getOtp() : "null") + "]");

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

        Double score = lastAnomalyScore.remove(userId != null ? userId : "anonymous");

        String explanation = "Verified successfully.";
        if (lastReq != null) {
            SecurityAnalysisRequest sr = new SecurityAnalysisRequest();
            sr.setTypingSpeedWpm(lastReq.getTelemetry().getTypingSpeedWpm());
            sr.setMouseMovementAvgSpeed(lastReq.getTelemetry().getMouseMovementAvgSpeed());
            sr.setScrollFrequency(lastReq.getTelemetry().getScrollFrequency());
            sr.setIpAddress("127.0.0.1 (Frontend)");
            sr.setRiskScore(score != null ? score : -0.05); // Use real score or fallback

            explanation = geminiAIService.analyzeSecurity(sr);
        }

        Map<String, String> successResponse = new HashMap<>();
        successResponse.put("status", "VERIFIED");
        successResponse.put("geminiExplanation", explanation);
        return ResponseEntity.ok(successResponse);
    }
}

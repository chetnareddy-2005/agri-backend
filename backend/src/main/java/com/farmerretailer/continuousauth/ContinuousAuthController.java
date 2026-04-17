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
                    String finalUserId = (userId != null) ? userId : "anonymous";
                    try { auditLogRepository.save(new AuditLog(finalUserId, "MEDIUM", "OTP_REQUIRED")); } catch(Exception e) {}
                    
                    String otp = generateOtp();
                    long expiryTime = System.currentTimeMillis() + (5 * 60 * 1000);
                    
                    otpStorage.put(finalUserId, new OtpData(otp, expiryTime));
                    lastTelemetryCache.put(finalUserId, requestDTO);
                    
                    // Prioritize the real user email from the userId if it's an email format
                    String targetEmail = (finalUserId.contains("@")) ? finalUserId : "chetnareddy2520@gmail.com";
                    
                    try { 
                        System.out.println("📧 Attempting to send OTP to: " + targetEmail);
                        emailService.sendOtpEmail(targetEmail, otp); 
                    } catch (Exception e) {
                        System.err.println("CRITICAL: EMAIL SENDING FAILED -> " + e.getMessage());
                    }
                    
                    System.out.println("🚨 SECURITY LOCK: Code " + otp + " generated for " + targetEmail);
                    
                    Map<String, String> mediumRiskBody = new HashMap<>();
                    mediumRiskBody.put("challenge", "OTP_REQUIRED");
                    mediumRiskBody.put("otp", otp); // Keeping this here so the demo works if email fails!
                    mediumRiskBody.put("message", "Suspicious activity. Security code sent to " + targetEmail);
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(mediumRiskBody);
                    
                case "LOW":
                default:
                    return ResponseEntity.ok(response);
            }
        } catch (Exception e) {
            System.err.println("RECOVERED FROM CRITICAL EVALUATION ERROR: " + e.getMessage());
            e.printStackTrace();
            // Return 200 OK so the frontend doesn't crash, but fail open for user convenience
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

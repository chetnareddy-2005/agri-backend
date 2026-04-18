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

            // Quick Fix (Demo Trigger) - Force OTP if mouse is frantically shaken!
            Double mouseSpeed = (requestDTO.getTelemetry() != null) ? requestDTO.getTelemetry().getMouseMovementAvgSpeed() : null;
            if (mouseSpeed != null && mouseSpeed > 1000) {
                response.setRiskLevel("MEDIUM");
                System.out.println("[Telemetry Debug] Risk (Forced via Hackathon Logic): MEDIUM");
            }

            switch(response.getRiskLevel()) {
                case "HIGH":
                    if (userId != null) auditLogRepository.save(new AuditLog(userId, "HIGH", "BLOCKED"));
                    Map<String, String> highRiskBody = new HashMap<>();
                    highRiskBody.put("error", "Session terminated due to high risk behavior.");
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(highRiskBody);

                case "MEDIUM":
                    if (userId != null) auditLogRepository.save(new AuditLog(userId, "MEDIUM", "OTP_REQUIRED"));
                    String otp = generateOtp();
                    long expiryTime = System.currentTimeMillis() + (5 * 60 * 1000); // 5 mins

                    otpStorage.put(userId != null ? userId : "anonymous", new OtpData(otp, expiryTime));
                    lastTelemetryCache.put(userId != null ? userId : "anonymous", requestDTO);

                    String targetEmail = (userId != null && userId.contains("@")) ? userId : "farmer_bob@farm2trade.com";
                    try {
                        emailService.sendOtp(targetEmail, otp);
                    } catch (Exception e) {
                        System.err.println("[Telemetry Debug] Email failed but continuing demo loop: " + e.getMessage());
                    }

                    // 🔥 HACKATHON DEMO: Print it directly to terminal
                    System.out.println("==================================================");
                    System.out.println("🚨 OTP REQUIRED FOR USER: " + targetEmail);
                    System.out.println("🔑 THE SECRET OTP IS: >>> " + otp + " <<<");
                    System.out.println("==================================================");

                    Map<String, Object> mediumRiskBody = new HashMap<>();
                    mediumRiskBody.put("challenge", "OTP_REQUIRED");
                    mediumRiskBody.put("otp", otp); 
                    mediumRiskBody.put("message", "Suspicious activity detected. OTP sent to your email.");
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
            return ResponseEntity.status(HttpStatus.OK).body(new ContinuousAuthResponseDTO(requestDTO.getUserId(), "LOW", 0.0));
        }
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

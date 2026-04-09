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

    // Temporary storage for OTPs (In prod use Redis/DB)
    private final Map<String, String> otpStorage = new ConcurrentHashMap<>();
    
    // Quick cache for user's last telemetry so Gemini has context
    private final Map<String, ContinuousAuthRequestDTO> lastTelemetryCache = new ConcurrentHashMap<>();

    private String generateOtp() {
        return String.valueOf((int)(Math.random() * 900000) + 100000);
    }

    @PostMapping("/evaluate")
    public ResponseEntity<?> evaluateTelemetry(@RequestBody ContinuousAuthRequestDTO requestDTO) {
        ContinuousAuthResponseDTO response = anomalyDetectionService.evaluateRisk(requestDTO);
        
        switch(response.getRiskLevel()) {
            case "HIGH":
                // Real scenario: trigger JWT invalidation and logout
                Map<String, String> highRiskBody = new HashMap<>();
                highRiskBody.put("error", "Session terminated due to high risk behavior.");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(highRiskBody);
                
            case "MEDIUM":
                // Trigger Step-up Authentication via OTP
                String otp = generateOtp();
                String userId = requestDTO.getUserId();
                
                otpStorage.put(userId, otp);
                lastTelemetryCache.put(userId, requestDTO);
                
                // Fallback email routing if ID is anonymous
                String targetEmail = userId.contains("@") ? userId : "farmer_bob@farm2trade.com";
                emailService.sendOtpEmail(targetEmail, otp);
                
                Map<String, String> mediumRiskBody = new HashMap<>();
                mediumRiskBody.put("challenge", "OTP_REQUIRED");
                mediumRiskBody.put("message", "Suspicious activity detected. OTP sent to your email.");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(mediumRiskBody);
                
            case "LOW":
            default:
                return ResponseEntity.ok(response);
        }
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> req) {
        String userId = req.get("userId");
        String enteredOtp = req.get("otp");

        if (userId != null && otpStorage.containsKey(userId) && otpStorage.get(userId).equals(enteredOtp)) {
            // Successfully verified step-up! Now use Gemini AI to explain the anomaly!
            ContinuousAuthRequestDTO lastReq = lastTelemetryCache.get(userId);
            
            String explanation = "Verified successfully.";
            if (lastReq != null) {
                SecurityAnalysisRequest sr = new SecurityAnalysisRequest();
                sr.setTypingSpeedWpm(lastReq.getTelemetry().getTypingSpeedWpm());
                sr.setMouseMovementAvgSpeed(lastReq.getTelemetry().getMouseMovementAvgSpeed());
                sr.setScrollFrequency(lastReq.getTelemetry().getScrollFrequency());
                sr.setIpAddress("127.0.0.1 (Frontend)");
                sr.setRiskScore("-0.05"); // It triggered MEDIUM
                
                explanation = geminiAIService.analyzeSecurity(sr);
            }
            
            otpStorage.remove(userId);
            lastTelemetryCache.remove(userId);

            Map<String, String> successResponse = new HashMap<>();
            successResponse.put("status", "VERIFIED");
            successResponse.put("geminiExplanation", explanation);
            return ResponseEntity.ok(successResponse);
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("INVALID OTP");
    }
}

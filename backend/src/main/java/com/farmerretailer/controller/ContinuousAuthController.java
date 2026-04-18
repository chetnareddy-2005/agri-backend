package com.farmerretailer.controller;

import com.farmerretailer.service.EmailService;
import com.farmerretailer.service.GeminiService;
import com.farmerretailer.service.UserService;
import com.farmerretailer.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/auth/continuous")
@CrossOrigin(origins = "*")
public class ContinuousAuthController {

    @Autowired
    private EmailService emailService;

    @Autowired
    private GeminiService geminiService;

    @Autowired
    private UserService userService;

    // Temporary storage for OTPs (In-memory for demo; use Redis/DB for production)
    private static final Map<String, String> otpStorage = new ConcurrentHashMap<>();

    @PostMapping("/evaluate-risk")
    public ResponseEntity<?> evaluateRisk(@RequestBody Map<String, Object> payload) {
        String userId = (String) payload.get("userId");
        String risk = (String) payload.get("risk"); // Expected from ML service or logic
        String userEmail = (String) payload.get("email");

        if ("MEDIUM".equals(risk)) {
            String otp = generateOtp();
            otpStorage.put(userId, otp);
            
            // Send email asynchronously
            emailService.sendOtp(userEmail, otp);

            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("status", "OTP_REQUIRED", "message", "Behavioral abnormality detected. Check your email."));
        } else if ("HIGH".equals(risk)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("status", "BLOCKED", "message", "Session terminated due to high security risk."));
        }

        return ResponseEntity.ok(Map.of("status", "ALLOW"));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> req) {
        String userId = req.get("userId");
        String enteredOtp = req.get("otp");
        String telemetry = req.get("telemetry"); // Optional: Passing behavioral data for analysis

        if (otpStorage.containsKey(userId) && otpStorage.get(userId).equals(enteredOtp)) {
            otpStorage.remove(userId);

            // Fetch explanation from Gemini AI
            String behaviorDetails = telemetry != null ? telemetry : "Typing: Anomalous, Mouse: Erratic, Location: New";
            String explanation = geminiService.analyzeSecurityAnomaly(Map.of(
                    "typing_speed", "Unexpected change detected",
                    "mouse_movement", "High entropy movements",
                    "device_info", "Generic / Masked",
                    "ip_address", "Unknown",
                    "risk_score", "MEDIUM"
            ));

            return ResponseEntity.ok(Map.of(
                "status", "VERIFIED",
                "message", "Identify confirmed. Session restored.",
                "geminiExplanation", explanation
            ));
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("status", "FAILED", "message", "Invalid or expired OTP"));
    }

    private String generateOtp() {
        return String.valueOf((int) (Math.random() * 900000) + 100000);
    }
}

package com.farmerretailer.controller;

import com.farmerretailer.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String newPassword = payload.get("newPassword");

        try {
            userService.resetPassword(email, newPassword);
            return ResponseEntity.ok("Password reset successfully.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error resetting password: " + e.getMessage());
        }
    }

    @Autowired
    private org.springframework.security.authentication.AuthenticationManager authenticationManager;

    // Explicitly use HttpSessionSecurityContextRepository to persist session
    @org.springframework.beans.factory.annotation.Autowired
    private com.farmerretailer.config.TokenRegistry tokenRegistry;

    private final org.springframework.security.web.context.SecurityContextRepository securityContextRepository = new org.springframework.security.web.context.HttpSessionSecurityContextRepository();

    @Autowired
    private com.farmerretailer.repository.UserRepository userRepository;

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody Map<String, String> loginData,
            jakarta.servlet.http.HttpServletRequest request,
            jakarta.servlet.http.HttpServletResponse response) {
        String email = loginData.get("email");
        String password = loginData.get("password");

        try {
            // STEP 1: AUTHENTICATE FIRST (Common logic handles the DB lookup once)
            org.springframework.security.core.Authentication authentication = authenticationManager.authenticate(
                    new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(email, password));

            // STEP 2: IF SUCCESSFUL, GET USER (Only 1 query here)
            com.farmerretailer.entity.User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new org.springframework.security.core.userdetails.UsernameNotFoundException("User not found"));

            // STEP 3: SECURITY CONTEXT PERSISTENCE
            org.springframework.security.core.context.SecurityContext context = org.springframework.security.core.context.SecurityContextHolder.createEmptyContext();
            context.setAuthentication(authentication);
            org.springframework.security.core.context.SecurityContextHolder.setContext(context);
            securityContextRepository.saveContext(context, request, response);

            // STEP 4: CHECKS
            if (!user.isActive()) return ResponseEntity.status(403).body("Account is inactive.");
            if (!user.isVerified()) return ResponseEntity.status(403).body("Account is pending approval.");

            // STEP 5: TOKEN GENERATION
            String token = java.util.UUID.randomUUID().toString();
            tokenRegistry.registerToken(token, authentication);

            // STEP 6: FAST RESPONSE MAPPING
            java.util.Map<String, Object> responseMap = new java.util.HashMap<>();
            responseMap.put("message", "Login successful");
            responseMap.put("role", user.getRole());
            responseMap.put("fullName", user.getFullName());
            responseMap.put("email", user.getEmail());
            responseMap.put("token", token);
            responseMap.put("mustChangePassword", user.isMustChangePassword());
            
            // Add other fields only if needed for standard dashboard view
            responseMap.put("businessName", user.getBusinessName());
            responseMap.put("verified", user.isVerified());

            return ResponseEntity.ok(responseMap);

        } catch (org.springframework.security.core.AuthenticationException e) {
            // Handle the "Must Change Password" edge case if standard auth fails due to null password in DB
            com.farmerretailer.entity.User user = userRepository.findByEmail(email).orElse(null);
            if (user != null && user.isMustChangePassword()) {
                // Return must-change flag even if password auth fails (since it's likely not set yet)
                return ResponseEntity.ok(Map.of("mustChangePassword", true, "email", email));
            }
            return ResponseEntity.status(401).body("Invalid email or password");
        }
    }

    @PostMapping(value = "/register", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> registerUser(@RequestParam("user") String userJson,
            @RequestParam(value = "file", required = false) org.springframework.web.multipart.MultipartFile file) {
        System.out.println("Registering user from Multipart Request");

        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
        com.farmerretailer.dto.UserRegistrationDTO registrationDTO = null;

        try {
            registrationDTO = mapper.readValue(userJson, com.farmerretailer.dto.UserRegistrationDTO.class);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Invalid user data format: " + e.getMessage());
        }

        System.out.println("Registering user: " + registrationDTO.getEmail());
        try {
            if (userRepository.existsByEmail(registrationDTO.getEmail())) {
                return ResponseEntity.badRequest().body("Error: Email is already in use!");
            }

            com.farmerretailer.entity.User user = new com.farmerretailer.entity.User();
            user.setFullName(registrationDTO.getFullName());
            user.setEmail(registrationDTO.getEmail());
            // user.setPassword(registrationDTO.getPassword()); // Removed for new flow
            user.setPassword("PENDING_SETUP_PRE_HASH"); // Defensive setting to avoid null password error if Service is
                                                        // stale
            user.setMobileNumber(registrationDTO.getMobileNumber());
            user.setBusinessName(registrationDTO.getBusinessName());
            user.setAddress(registrationDTO.getAddress());
            user.setCity(registrationDTO.getCity());
            user.setState(registrationDTO.getState());
            user.setDescription(registrationDTO.getDescription());

            // Set Document Name logic
            // If file is provided, use its name. If not, use what's in DTO (backward logic
            // or manual override)
            if (file != null && !file.isEmpty()) {
                System.out.println("File received: " + file.getOriginalFilename() + " Size: " + file.getSize());
                user.setDocumentName(file.getOriginalFilename());
                user.setDocumentContent(file.getBytes());
                user.setDocumentContentType(file.getContentType());
            } else {
                System.out.println("No file received or file is empty.");
                user.setDocumentName(registrationDTO.getDocumentName());
            }

        // Robust Role Assignment
        String roleStr = (registrationDTO.getRole() != null) ? registrationDTO.getRole().toUpperCase().trim() : "FARMER";
        System.out.println("Processing registration for role: " + roleStr);
        
        try {
            user.setRole(com.farmerretailer.model.Role.valueOf(roleStr));
        } catch (IllegalArgumentException e) {
            System.err.println("CRITICAL: Invalid role received '" + roleStr + "'. Check DTO/Frontend mapping.");
            return ResponseEntity.badRequest().body("Error: Invalid role '" + roleStr + "'. Allowed: FARMER, RETAILER, TRANSPORTER");
        }

        user.setVerified(false);
        user.setActive(true);

        try {
            userService.registerUser(user);
            System.out.println("User " + user.getEmail() + " successfully persisted to database.");
            return ResponseEntity.ok("User registered successfully. Please wait for admin approval.");
        } catch (Exception e) {
            System.err.println("DATABASE ERROR during registration: " + e.getMessage());
            e.printStackTrace();
            if (e.getMessage().contains("Data truncated")) {
                return ResponseEntity.internalServerError().body("System Error: Database schema mismatch for column 'role'. Contact Admin.");
            }
            return ResponseEntity.badRequest().body("Error registering user: " + e.getMessage());
        }
    }

    @PostMapping("/change-initial-password")
    public ResponseEntity<?> changeInitialPassword(@RequestBody Map<String, String> payload) {
        String email = payload.get("email"); // Or extract from context if authenticated
        String newPassword = payload.get("newPassword");

        if (email == null || newPassword == null) {
            return ResponseEntity.badRequest().body("Email and password are required.");
        }

        try {
            com.farmerretailer.entity.User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            userService.updatePassword(user, newPassword);
            return ResponseEntity.ok("Password updated successfully.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error updating password: " + e.getMessage());
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(jakarta.servlet.http.HttpServletRequest request) {
        String token = request.getHeader("X-Auth-Token");
        tokenRegistry.removeToken(token);
        return ResponseEntity.ok("Logged out");
    }
}


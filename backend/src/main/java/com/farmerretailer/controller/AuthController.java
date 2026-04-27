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

    @org.springframework.transaction.annotation.Transactional
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

    @org.springframework.beans.factory.annotation.Autowired
    private com.farmerretailer.config.TokenRegistry tokenRegistry;

    private final org.springframework.security.web.context.SecurityContextRepository securityContextRepository = new org.springframework.security.web.context.HttpSessionSecurityContextRepository();

    @Autowired
    private com.farmerretailer.repository.UserRepository userRepository;

    @org.springframework.transaction.annotation.Transactional
    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody Map<String, String> loginData,
            jakarta.servlet.http.HttpServletRequest request,
            jakarta.servlet.http.HttpServletResponse response) {
        String email = loginData.get("email");
        String password = loginData.get("password");

        try {
            org.springframework.security.core.Authentication authentication = authenticationManager.authenticate(
                    new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(email, password));

            com.farmerretailer.entity.User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new org.springframework.security.core.userdetails.UsernameNotFoundException("User not found"));

            org.springframework.security.core.context.SecurityContext context = org.springframework.security.core.context.SecurityContextHolder.createEmptyContext();
            context.setAuthentication(authentication);
            org.springframework.security.core.context.SecurityContextHolder.setContext(context);
            securityContextRepository.saveContext(context, request, response);

            if (!user.isActive()) return ResponseEntity.status(403).body("Account is inactive.");
            if (!user.isVerified()) return ResponseEntity.status(403).body("Account is pending approval.");

            String token = java.util.UUID.randomUUID().toString();
            tokenRegistry.registerToken(token, authentication);

            java.util.Map<String, Object> responseMap = new java.util.HashMap<>();
            responseMap.put("message", "Login successful");
            responseMap.put("role", user.getRole());
            responseMap.put("fullName", user.getFullName());
            responseMap.put("email", user.getEmail());
            responseMap.put("token", token);
            responseMap.put("mustChangePassword", user.isMustChangePassword());
            responseMap.put("businessName", user.getBusinessName());
            responseMap.put("verified", user.isVerified());

            return ResponseEntity.ok(responseMap);

        } catch (org.springframework.security.core.AuthenticationException e) {
            com.farmerretailer.entity.User user = userRepository.findByEmail(email).orElse(null);
            if (user != null && user.isMustChangePassword()) {
                return ResponseEntity.ok(Map.of("mustChangePassword", true, "email", email));
            }
            return ResponseEntity.status(401).body("Invalid email or password");
        }
    }

    @org.springframework.transaction.annotation.Transactional
    @PostMapping(value = "/register", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> registerUser(@RequestParam("user") String userJson,
            @RequestParam(value = "file", required = false) org.springframework.web.multipart.MultipartFile file) {

        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
        com.farmerretailer.dto.UserRegistrationDTO registrationDTO = null;

        try {
            registrationDTO = mapper.readValue(userJson, com.farmerretailer.dto.UserRegistrationDTO.class);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Invalid user data format: " + e.getMessage());
        }

        try {
            if (userRepository.existsByEmail(registrationDTO.getEmail())) {
                return ResponseEntity.badRequest().body("Error: Email is already in use!");
            }

            com.farmerretailer.entity.User user = new com.farmerretailer.entity.User();
            user.setFullName(registrationDTO.getFullName());
            user.setEmail(registrationDTO.getEmail());
            user.setPassword("PENDING_SETUP_PRE_HASH");
            user.setMobileNumber(registrationDTO.getMobileNumber());
            user.setBusinessName(registrationDTO.getBusinessName());
            user.setAddress(registrationDTO.getAddress());
            user.setCity(registrationDTO.getCity());
            user.setState(registrationDTO.getState());
            user.setDescription(registrationDTO.getDescription());

            if (file != null && !file.isEmpty()) {
                user.setDocumentName(file.getOriginalFilename());
                user.setDocumentContent(file.getBytes());
                user.setDocumentContentType(file.getContentType());
            } else {
                user.setDocumentName(registrationDTO.getDocumentName());
            }

            // Robust Role Assignment
            String roleStr = (registrationDTO.getRole() != null) ? registrationDTO.getRole().toUpperCase().trim() : "FARMER";
            try {
                user.setRole(com.farmerretailer.model.Role.valueOf(roleStr));
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body("Error: Invalid role '" + roleStr + "'. Allowed: FARMER, RETAILER, TRANSPORTER");
            }

            user.setVerified(false);
            user.setActive(true);

            userService.registerUser(user);
            return ResponseEntity.ok("User registered successfully. Please wait for admin approval.");

        } catch (Exception e) {
            if (e.getMessage().contains("Data truncated")) {
                return ResponseEntity.internalServerError().body("System Error: Database schema mismatch for column 'role'.");
            }
            return ResponseEntity.badRequest().body("Error registering user: " + e.getMessage());
        }
    }

    @org.springframework.transaction.annotation.Transactional
    @PostMapping("/change-initial-password")
    public ResponseEntity<?> changeInitialPassword(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
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

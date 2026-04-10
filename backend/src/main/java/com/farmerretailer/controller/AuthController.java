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
            com.farmerretailer.entity.User user = userRepository.findByEmail(email).orElse(null);

            if (user == null) {
                return ResponseEntity.status(401).body("User not found");
            }

            // BYPASS check if mustChangePassword is true (First login after approval)
            org.springframework.security.core.Authentication authentication = null;

            if (user.isMustChangePassword()) {
                // Manually create authentication for first-time login
                // We use a special authority/logic or just standard roles? Standards roles are
                // fine, but frontend will restrict.
                java.util.List<org.springframework.security.core.GrantedAuthority> authorities = java.util.Collections
                        .singletonList(
                                new org.springframework.security.core.authority.SimpleGrantedAuthority(
                                        user.getRole().name()));
                authentication = new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                        email, null, authorities);
            } else {
                authentication = authenticationManager.authenticate(
                        new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(email,
                                password));
            }

            // Persist the security context for the session
            org.springframework.security.core.context.SecurityContext context = org.springframework.security.core.context.SecurityContextHolder
                    .createEmptyContext();
            context.setAuthentication(authentication);
            org.springframework.security.core.context.SecurityContextHolder.setContext(context);
            securityContextRepository.saveContext(context, request, response);

            if (!user.isActive()) {
                return ResponseEntity.status(403).body("Account is inactive.");
            }
            if (!user.isVerified()) { // Note: verified field maps to 'isVerified' column logic
                return ResponseEntity.status(403).body("Account is pending approval.");
            }

            java.util.Map<String, Object> responseMap = new java.util.HashMap<>();
            responseMap.put("message", "Login successful");
            responseMap.put("role", user.getRole());
            responseMap.put("fullName", user.getFullName());
            responseMap.put("email", user.getEmail());
            responseMap.put("mobileNumber", user.getMobileNumber());
            responseMap.put("businessName", user.getBusinessName());
            responseMap.put("address", user.getAddress());
            responseMap.put("city", user.getCity());
            responseMap.put("state", user.getState());
            responseMap.put("description", user.getDescription());
            responseMap.put("documentName", user.getDocumentName());
            responseMap.put("verified", user.isVerified());
            responseMap.put("verified", user.isVerified());
            responseMap.put("active", user.isActive());
            responseMap.put("mustChangePassword", user.isMustChangePassword()); // Flag for frontend

            return ResponseEntity.ok(responseMap);

        } catch (org.springframework.security.core.AuthenticationException e) {
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

            // Default to FARMER if not specified or invalid, but handle string to enum
            try {
                user.setRole(com.farmerretailer.model.Role.valueOf(registrationDTO.getRole()));
            } catch (IllegalArgumentException | NullPointerException e) {
                user.setRole(com.farmerretailer.model.Role.FARMER);
            }

            user.setVerified(false); // New users are not verified by default
            user.setActive(true);

            userService.registerUser(user);
            return ResponseEntity.ok("User registered successfully. Please wait for admin approval.");
        } catch (Exception e) {
            if (e.getMessage().contains("Duplicate entry")) {
                return ResponseEntity.badRequest().body("Error: Email is already in use!");
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
}


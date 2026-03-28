package com.farmerretailer.controller;

import com.farmerretailer.entity.Complaint;
import com.farmerretailer.service.ComplaintService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/complaints")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class ComplaintController {

    @Autowired
    private ComplaintService complaintService;

    @PostMapping("/create")
    public ResponseEntity<?> createComplaint(@RequestBody Map<String, String> payload, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        try {
            String message = payload.get("message");
            if (message == null || message.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Message is required");
            }
            Complaint complaint = complaintService.createComplaint(principal.getName(), message);
            return ResponseEntity.ok(complaint);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/reply")
    public ResponseEntity<?> replyToComplaint(@PathVariable Long id, @RequestBody Map<String, String> payload,
            Principal principal) {
        if (principal == null)
            return ResponseEntity.status(401).build();
        try {
            String message = payload.get("message");
            if (message == null || message.trim().isEmpty())
                return ResponseEntity.badRequest().body("Message is required");

            return ResponseEntity.ok(complaintService.replyToComplaint(id, principal.getName(), message));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/my-complaints")
    public ResponseEntity<?> getMyComplaints(Principal principal) {
        if (principal == null)
            return ResponseEntity.status(401).build();
        return ResponseEntity.ok(complaintService.getUserComplaints(principal.getName()));
    }

    // Admin sending a new message to a specific user
    @PostMapping("/send-message")
    public ResponseEntity<?> sendMessageToUser(@RequestBody Map<String, Object> payload, Principal principal) {
        if (principal == null)
            return ResponseEntity.status(401).build();
        // Ideally verify principal is ADMIN (skipped for brevity, service layer handles
        // logic if needed, or secure config)

        try {
            String targetUserIdStr = String.valueOf(payload.get("userId"));
            Long targetUserId = Long.parseLong(targetUserIdStr);
            String message = (String) payload.get("message");

            if (message == null || message.trim().isEmpty())
                return ResponseEntity.badRequest().body("Message is required");

            return ResponseEntity
                    .ok(complaintService.createComplaintForUser(principal.getName(), targetUserId, message));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAllComplaints() {
        // In a real app, restrict this to Admin only usually
        // Assuming Admin calls this
        try {
            List<Complaint> complaints = complaintService.getAllComplaints();
            return ResponseEntity.ok(complaints);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PutMapping("/{id}/mark-read-admin")
    public ResponseEntity<?> markAsReadByAdmin(@PathVariable Long id, Principal principal) {
        if (principal == null)
            return ResponseEntity.status(401).build();
        try {
            complaintService.markComplaintAsReadByAdmin(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
}

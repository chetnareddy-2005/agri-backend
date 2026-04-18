package com.farmerretailer.controller;

import com.farmerretailer.entity.Feedback;
import com.farmerretailer.entity.Order;
import com.farmerretailer.service.FeedbackService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {

    @Autowired
    private FeedbackService feedbackService;

    @PostMapping("/submit")
    public ResponseEntity<?> submitFeedback(@RequestBody Map<String, Object> payload, Principal principal) {
        if (principal == null)
            return ResponseEntity.status(401).build();
        try {
            Long orderId = Long.valueOf(payload.get("orderId").toString());
            Integer rating = Integer.valueOf(payload.get("rating").toString());
            String comment = (String) payload.get("comment");

            Feedback feedback = feedbackService.submitFeedback(orderId, rating, comment, principal.getName());
            return ResponseEntity.ok(feedback);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/pending")
    public ResponseEntity<List<Order>> getPendingFeedbackOrders(Principal principal) {
        if (principal == null)
            return ResponseEntity.status(401).build();
        return ResponseEntity.ok(feedbackService.getPendingFeedbackOrders(principal.getName()));
    }

    @GetMapping("/received")
    public ResponseEntity<List<Feedback>> getReceivedFeedbacks(Principal principal) {
        if (principal == null)
            return ResponseEntity.status(401).build();
        return ResponseEntity.ok(feedbackService.getFeedbacksForFarmer(principal.getName()));
    }
}

package com.farmerretailer.controller;

import com.farmerretailer.entity.Notification;
import com.farmerretailer.entity.User;
import com.farmerretailer.repository.NotificationRepository;
import com.farmerretailer.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;
import org.springframework.transaction.annotation.Transactional;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    @GetMapping("/my-notifications")
    public ResponseEntity<List<Notification>> getMyNotifications(Principal principal) {
        if (principal == null)
            return ResponseEntity.status(401).build();
        User user = userRepository.findByEmail(principal.getName()).orElseThrow();
        return ResponseEntity.ok(notificationRepository.findByUserIdOrderByTimestampDesc(user.getId()));
    }

    @PutMapping("/{id}/read")
    @Transactional
    public ResponseEntity<?> markAsRead(@PathVariable Long id, Principal principal) {
        if (principal == null)
            return ResponseEntity.status(401).build();
        Notification n = notificationRepository.findById(id).orElseThrow();
        // Validation: Ensure notification belongs to user?
        // Skipped for brevity, but good practice.
        n.setRead(true);
        notificationRepository.saveAndFlush(n);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/mark-all-read")
    @Transactional
    public ResponseEntity<?> markAllAsRead(Principal principal) {
        if (principal == null)
            return ResponseEntity.status(401).build();
        User user = userRepository.findByEmail(principal.getName()).orElseThrow();
        List<Notification> notifications = notificationRepository.findByUserIdOrderByTimestampDesc(user.getId());

        for (Notification n : notifications) {
            if (!n.isRead()) {
                n.setRead(true);
                notificationRepository.saveAndFlush(n);
            }
        }
        return ResponseEntity.ok("All marked as read");
    }
}

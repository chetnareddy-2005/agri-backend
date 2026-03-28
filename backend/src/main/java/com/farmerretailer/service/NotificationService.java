package com.farmerretailer.service;

import com.farmerretailer.entity.Notification;
import com.farmerretailer.entity.User;
import com.farmerretailer.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Transactional
    public void createNotification(User user, String title, String message, String type) {
        createNotification(user, title, message, type, null);
    }

    @Transactional
    public void createNotification(User user, String title, String message, String type, Long relatedEntityId) {
        if (user == null)
            return;

        Notification notification = new Notification(user, title, message, type);
        notification.setRelatedEntityId(relatedEntityId);
        notificationRepository.save(notification);
    }

    // Helper method if you have userId instead of User object, though usage of User
    // object is preferred for consistency
    // public void createNotification(Long userId, String title, String message,
    // String type) { ... }
}

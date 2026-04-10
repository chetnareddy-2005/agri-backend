package com.farmerretailer.service;

import com.farmerretailer.entity.Complaint;
import com.farmerretailer.entity.User;
import com.farmerretailer.repository.ComplaintRepository;
import com.farmerretailer.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class ComplaintService {

        @Autowired
        private com.farmerretailer.repository.ComplaintResponseRepository complaintResponseRepository;

        @Autowired
        private NotificationService notificationService;

        @Autowired
        private UserRepository userRepository;

        @Autowired
        private ComplaintRepository complaintRepository;

        @Transactional
        public Complaint createComplaint(String email, String message) {
                User user = userRepository.findByEmail(email)
                                .orElseThrow(() -> new RuntimeException("User not found"));

                Complaint complaint = new Complaint(user, message);
                return complaintRepository.save(complaint);
        }

        @Transactional
        public com.farmerretailer.entity.ComplaintResponse replyToComplaint(Long complaintId, String responderEmail,
                        String message) {
                Complaint complaint = complaintRepository.findById(complaintId)
                                .orElseThrow(() -> new RuntimeException("Complaint not found"));
                User responder = userRepository.findByEmail(responderEmail)
                                .orElseThrow(() -> new RuntimeException("Responder not found"));

                com.farmerretailer.entity.ComplaintResponse response = new com.farmerretailer.entity.ComplaintResponse(
                                complaint, responder, message);
                complaintResponseRepository.save(response);

                // Update status if Admin responds
                // Update status if Admin responds
                if (responder.getRole() == com.farmerretailer.model.Role.ADMIN) {
                        complaint.setHasUnreadMessagesForAdmin(false);
                } else {
                        complaint.setHasUnreadMessagesForAdmin(true);
                }
                complaintRepository.save(complaint);

                // Notify the OTHER party
                User recipient = (responder.getId().equals(complaint.getUser().getId())) ?
                // If responder is the complainer (User), notify Admin (conceptually, or just
                // rely on Admin dash)
                                null :
                                // If responder is Admin, notify the User
                                complaint.getUser();

                if (recipient != null) {
                        notificationService
                                        .createNotification(recipient, "New Reply on Complaint #" + complaint.getId(),
                                                        "You have a new reply: " + (message.length() > 30
                                                                        ? message.substring(0, 30) + "..."
                                                                        : message),
                                                        "complaint_reply", complaint.getId());
                }

                return response;
        }

        public List<Complaint> getAllComplaints() {
                return complaintRepository.findAllByOrderByTimestampDesc();
        }

        public List<Complaint> getUserComplaints(String email) {
                User user = userRepository.findByEmail(email).orElseThrow();
                return complaintRepository.findByUserIdOrderByTimestampDesc(user.getId());
        }

        @Transactional
        public Complaint createComplaintForUser(String adminEmail, Long targetUserId, String message) {
                // Admin starts a thread "on behalf of system" or just direct message
                // For simplicity, we treat it as a Complaint where user is the target, but
                // maybe we need a flag?
                // Actually, request was "Send message to...". We can create a Complaint entry
                // where user=target, and add an initial response from Admin.

                User admin = userRepository.findByEmail(adminEmail).orElseThrow();
                User targetUser = userRepository.findById(targetUserId)
                                .orElseThrow(() -> new RuntimeException("Target user not found"));

                // We create a "Complaint" but seemingly initiated by Admin.
                // To distinguish, maybe we prefix message? Or just let it be.
                // Better: The 'Complaint' object owns the thread. If Admin starts it, it's like
                // "System Message".
                Complaint complaint = new Complaint(targetUser, message);
                complaint.setIsAdminInitiated(true);
                complaint.setStatus("OPEN");
                complaint.setHasUnreadMessagesForAdmin(false); // Admin initiated, so read
                complaintRepository.save(complaint);

                // Notify User immediately
                notificationService.createNotification(targetUser, "New Message from Admin",
                                "Admin sent you a message: " + message, "complaint_reply", complaint.getId());

                return complaint;
        }

        @Transactional
        public void markComplaintAsReadByAdmin(Long complaintId) {
                Complaint complaint = complaintRepository.findById(complaintId)
                                .orElseThrow(() -> new RuntimeException("Complaint not found"));
                complaint.setHasUnreadMessagesForAdmin(false);
                complaintRepository.save(complaint);
        }
}


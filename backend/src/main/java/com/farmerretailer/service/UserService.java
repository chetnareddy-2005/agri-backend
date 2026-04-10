package com.farmerretailer.service;

import com.farmerretailer.entity.User;
import com.farmerretailer.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmailService emailService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private com.farmerretailer.repository.ComplaintRepository complaintRepository;
    @Autowired
    private com.farmerretailer.repository.ComplaintResponseRepository complaintResponseRepository;
    @Autowired
    private com.farmerretailer.repository.FeedbackRepository feedbackRepository;

    public void approveUser(Long userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isPresent()) {
            User user = userOpt.get();

            // Generate simple temp password (first 8 chars of UUID)
            // Generate simple temp password (first 8 chars of UUID)
            // String tempPassword = UUID.randomUUID().toString().substring(0, 8);

            // user.setPassword(passwordEncoder.encode(tempPassword)); // KEEP ORIGINAL
            // PASSWORD FOR DEMO
            user.setVerified(true); // Mark as verified/approved
            user.setMustChangePassword(true); // Force password set on first login

            userRepository.save(user);

            emailService.sendApprovalEmail(user.getEmail(), ""); // No temp password needed

            notificationService.createNotification(
                    user,
                    "Account Approved",
                    "Your account has been approved! You can now log in.",
                    "success");
        } else {
            throw new RuntimeException("User not found with id: " + userId);
        }
    }

    @Autowired
    private com.farmerretailer.repository.NotificationRepository notificationRepository;
    @Autowired
    private com.farmerretailer.repository.ProductRepository productRepository;
    @Autowired
    private com.farmerretailer.repository.OrderRepository orderRepository;
    @Autowired
    private com.farmerretailer.repository.BidRepository bidRepository;

    @org.springframework.transaction.annotation.Transactional
    public void rejectUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        // 1. Delete Notifications
        notificationRepository.deleteByUserId(userId);

        // 2. Delete Complaints & Responses
        // 2a. Delete responses made BY this user on any complaint
        complaintResponseRepository.deleteByResponderId(userId);

        // 2b. Delete complaints made BY this user (will cascade delete responses if
        // set, but let's be safe)
        // If CascadeType.ALL is set on Complaint.responses, deleting complaint is
        // enough.
        // Based on entity check: @OneToMany(mappedBy = "complaint", cascade =
        // CascadeType.ALL, fetch = FetchType.LAZY)
        // So just deleting user's complaints is sufficient for their own complaints.
        complaintRepository.deleteByUserId(userId);

        if (user.getRole() == com.farmerretailer.model.Role.FARMER) {
            // 3. Delete Farmer's Products (and their dependencies)
            java.util.List<com.farmerretailer.entity.Product> products = productRepository.findByFarmerId(userId);
            for (com.farmerretailer.entity.Product product : products) {
                // Delete related Bids
                bidRepository.deleteByProductId(product.getId());

                // Delete related Orders & their Feedbacks
                java.util.List<com.farmerretailer.entity.Order> orders = orderRepository
                        .findByProductId(product.getId());
                for (com.farmerretailer.entity.Order order : orders) {
                    feedbackRepository.deleteByOrderId(order.getId());
                }
                orderRepository.deleteAll(orders); // Delete the actual orders

                // Delete Product
                productRepository.delete(product);
            }
        } else if (user.getRole() == com.farmerretailer.model.Role.RETAILER) {
            // 4. Delete Retailer's Orders & their Feedbacks
            java.util.List<com.farmerretailer.entity.Order> retailerOrders = orderRepository.findByRetailerId(userId);
            for (com.farmerretailer.entity.Order order : retailerOrders) {
                feedbackRepository.deleteByOrderId(order.getId());
                // No need to delete Bids for order? Bids are on products.
                // Retailer makes bids?
                // Check Bid entity... usually retailer places bid.
            }
            orderRepository.deleteAll(retailerOrders);

            // 5. Delete Retailer's Bids
            bidRepository.deleteByRetailerId(userId);
        }

        // 6. Delete User
        userRepository.delete(user);
    }

    public void resetPassword(String email, String newPassword) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setPassword(passwordEncoder.encode(newPassword));
            user.setMustChangePassword(false);
            userRepository.save(user);
        } else {
            throw new RuntimeException("User not found with email: " + email);
        }
    }

    @Autowired
    private com.farmerretailer.repository.DriverRepository driverRepository;

    // Helper to create initial user (normally done by RegisterController)
    public User registerUser(User user) {
        // user.setPassword(passwordEncoder.encode(user.getPassword())); // Removed
        // strict check
        // Set placeholder password to satisfy DB constraints
        user.setPassword(passwordEncoder.encode("PENDING_SETUP"));
        User savedUser = userRepository.save(user);

        if (savedUser.getRole() == com.farmerretailer.model.Role.TRANSPORTER) {
            com.farmerretailer.entity.Driver driver = new com.farmerretailer.entity.Driver();
            driver.setUser(savedUser);
            // Default mappings from User fields
            driver.setVehicleType(savedUser.getBusinessName()); 
            driver.setCapacity(savedUser.getDescription());
            driver.setCurrentLat(0.0);
            driver.setCurrentLng(0.0);
            driver.setAvailable(true);
            driverRepository.save(driver);
        }

        return savedUser;
    }

    public void updatePassword(User user, String newPassword) {
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setMustChangePassword(false);
        userRepository.save(user);
    }

    public java.util.List<User> getPendingUsers() {
        return userRepository.findByVerifiedFalse();
    }

    public java.util.List<User> getApprovedUsersByRole(com.farmerretailer.model.Role role) {
        return userRepository.findByRoleAndVerifiedTrue(role);
    }

    public long countUsersByRole(com.farmerretailer.model.Role role) {
        return userRepository.countByRole(role);
    }

    public long countVerifiedUsersByRole(com.farmerretailer.model.Role role) {
        return userRepository.countByRoleAndVerifiedTrue(role);
    }

    public long countTotalUsers() {
        return userRepository.count();
    }
}


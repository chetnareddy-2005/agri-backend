package com.farmerretailer.controller;

import com.farmerretailer.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private UserService userService;

    @Autowired
    private com.farmerretailer.repository.AuditLogRepository auditLogRepository;

    @PostMapping("/approve/{userId}")
    public ResponseEntity<String> approveUser(@PathVariable Long userId) {
        try {
            userService.approveUser(userId);
            return ResponseEntity.ok("User approved successfully. Email sent.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error approving user: " + e.getMessage());
        }
    }

    @PostMapping("/reject/{userId}")
    public ResponseEntity<String> rejectUser(@PathVariable Long userId) {
        try {
            userService.rejectUser(userId);
            return ResponseEntity.ok("User rejected (deleted) successfully.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error rejecting user: " + e.getMessage());
        }
    }

    @DeleteMapping("/delete/{userId}")
    public ResponseEntity<String> deleteUser(@PathVariable Long userId) {
        try {
            userService.rejectUser(userId); // Reusing logic as it deletes the entity
            return ResponseEntity.ok("User deleted successfully.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error deleting user: " + e.getMessage());
        }
    }

    @GetMapping("/pending-users")
    public ResponseEntity<java.util.List<com.farmerretailer.entity.User>> getPendingUsers() {
        java.util.List<com.farmerretailer.entity.User> users = userService.getPendingUsers();
        System.out.println("Returning " + users.size() + " pending users.");
        return ResponseEntity.ok(users);
    }

    @GetMapping("/approved-farmers")
    public ResponseEntity<java.util.List<com.farmerretailer.entity.User>> getApprovedFarmers() {
        return ResponseEntity.ok(userService.getApprovedUsersByRole(com.farmerretailer.model.Role.ROLE_FARMER));
    }

    @GetMapping("/approved-retailers")
    public ResponseEntity<java.util.List<com.farmerretailer.entity.User>> getApprovedRetailers() {
        return ResponseEntity.ok(userService.getApprovedUsersByRole(com.farmerretailer.model.Role.ROLE_RETAILER));
    }

    @GetMapping("/approved-transporters")
    public ResponseEntity<java.util.List<com.farmerretailer.entity.User>> getApprovedTransporters() {
        return ResponseEntity.ok(userService.getApprovedUsersByRole(com.farmerretailer.model.Role.ROLE_TRANSPORTER));
    }

    @GetMapping("/stats")
    public ResponseEntity<java.util.Map<String, Object>> getDashboardStats() {
        System.out.println("Fetching dashboard stats...");
        java.util.Map<String, Object> stats = new java.util.HashMap<>();
        long total = userService.countTotalUsers(); // Keeps total registered
        long farmers = userService.countVerifiedUsersByRole(com.farmerretailer.model.Role.ROLE_FARMER);
        long retailers = userService.countVerifiedUsersByRole(com.farmerretailer.model.Role.ROLE_RETAILER);
        long transporters = userService.countVerifiedUsersByRole(com.farmerretailer.model.Role.ROLE_TRANSPORTER);

        System.out.println(
                "Stats: Total=" + total + ", Approved Farmers=" + farmers + ", Approved Retailers=" + retailers + ", Approved Transporters=" + transporters);

        stats.put("totalUsers", total);
        stats.put("farmers", farmers);
        stats.put("retailers", retailers);
        stats.put("transportersCount", transporters);
        System.out.println("DEBUG: Final stats map: " + stats);
        return ResponseEntity.ok(stats);

    }

    @GetMapping("/transactions")
    public ResponseEntity<java.util.List<java.util.Map<String, Object>>> getTransactions() {
        java.util.List<com.farmerretailer.entity.Order> orders = orderRepository
                .findAll(org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC,
                        "orderDate"));
        java.util.List<java.util.Map<String, Object>> transactions = new java.util.ArrayList<>();

        for (com.farmerretailer.entity.Order order : orders) {
            java.util.Map<String, Object> t = new java.util.HashMap<>();
            t.put("id", order.getId());
            t.put("productName", order.getProduct() != null ? order.getProduct().getName() : "Unknown");
            t.put("farmerName",
                    (order.getProduct() != null && order.getProduct().getFarmer() != null)
                            ? order.getProduct().getFarmer().getFullName()
                            : "Unknown");
            t.put("retailerName", order.getRetailer() != null ? order.getRetailer().getFullName() : "Unknown");
            t.put("price", order.getTotalPrice());
            t.put("status", order.getStatus());
            t.put("date", order.getOrderDate());
            transactions.add(t);
        }
        return ResponseEntity.ok(transactions);
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<java.util.List<com.farmerretailer.entity.AuditLog>> getAuditLogs() {
        return ResponseEntity.ok(auditLogRepository.findAll(org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "timestamp")));
    }

    @DeleteMapping("/reset-products")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<String> resetProducts() {
        try {
            System.out.println("Resetting data: Deleting Bids, Orders, and Products...");
            bidRepository.deleteAll();
            orderRepository.deleteAll();
            productRepository.deleteAll();
            System.out.println("Data reset successful.");
            return ResponseEntity.ok("All products, bids, and orders have been deleted. You can start fresh.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error resetting data: " + e.getMessage());
        }
    }

    private com.farmerretailer.repository.UserRepository userRepository;
    @Autowired
    private com.farmerretailer.repository.ProductRepository productRepository;
    @Autowired
    private com.farmerretailer.repository.OrderRepository orderRepository;
    @Autowired
    private com.farmerretailer.repository.BidRepository bidRepository;
    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

}

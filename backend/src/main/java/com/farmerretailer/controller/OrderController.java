package com.farmerretailer.controller;

import com.farmerretailer.entity.Order;
import com.farmerretailer.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = {
        "http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176",
        "http://127.0.0.1:5173", "http://127.0.0.1:5174",
        "https://matcher-sculpture-delay.ngrok-free.app"
}, allowCredentials = "true")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @PostMapping("/place")
    public ResponseEntity<?> placeOrder(@RequestBody Map<String, Object> payload, Principal principal) {
        if (principal == null)
            return ResponseEntity.status(401).build();
        try {
            Long productId = Long.valueOf(payload.get("productId").toString());
            Double quantity = Double.valueOf(payload.get("quantity").toString());

            Order order = orderService.placeOrder(productId, principal.getName(), quantity);
            return ResponseEntity.ok(order);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/my-orders") // For Retailer
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ResponseEntity<List<Order>> getMyOrders(Principal principal) {
        if (principal == null) {
            System.err.println("DEBUG: getMyOrders - Principal is NULL!");
            return ResponseEntity.status(401).build();
        }
        System.out.println("DEBUG: getMyOrders called for: " + principal.getName());
        try {
            List<Order> orders = orderService.getRetailerOrders(principal.getName());
            System.out.println("DEBUG: Found " + (orders != null ? orders.size() : 0) + " orders for retailer");
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            System.err.println("DEBUG: Error in getMyOrders: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/received-orders") // For Farmer
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ResponseEntity<List<Order>> getReceivedOrders(Principal principal) {
        if (principal == null) {
            System.err.println("DEBUG: getReceivedOrders - Principal is NULL!");
            return ResponseEntity.status(401).build();
        }
        System.out.println("DEBUG: getReceivedOrders called for: " + principal.getName());
        try {
            List<Order> orders = orderService.getFarmerOrders(principal.getName());
            System.out.println("DEBUG: Found " + (orders != null ? orders.size() : 0) + " orders");
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            System.err.println("DEBUG: Error in getReceivedOrders: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/modify/{id}")
    public ResponseEntity<?> modifyOrder(@PathVariable Long id, @RequestBody Map<String, Object> payload,
            Principal principal) {
        if (principal == null)
            return ResponseEntity.status(401).build();
        try {
            Double quantity = Double.valueOf(payload.get("quantity").toString());
            // Using modifyOrder method we just added
            Order order = orderService.modifyOrder(id, quantity, principal.getName());
            return ResponseEntity.ok(order);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> payload,
            Principal principal) {
        if (principal == null)
            return ResponseEntity.status(401).build();
        try {
            String newStatus = payload.get("status");
            Order order = orderService.updateOrderStatus(id, newStatus);
            return ResponseEntity.ok(order);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PutMapping("/{id}/confirm-receipt")
    public ResponseEntity<?> confirmReceipt(@PathVariable Long id, Principal principal) {
        if (principal == null)
            return ResponseEntity.status(401).build();
        try {
            Order order = orderService.confirmOrderReceipt(id, principal.getName());
            return ResponseEntity.ok(order);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/{id}/invoice")
    public void getInvoice(@PathVariable Long id, jakarta.servlet.http.HttpServletResponse response) {
        try {
            response.setContentType("application/pdf");
            response.setHeader("Content-Disposition", "attachment; filename=invoice_" + id + ".pdf");
            orderService.generateInvoicePDF(id, response.getOutputStream());
        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(500);
        }
    }
}

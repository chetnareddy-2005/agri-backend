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
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176"}, allowCredentials = "true")
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
    public ResponseEntity<List<Order>> getMyOrders(Principal principal) {
        if (principal == null)
            return ResponseEntity.status(401).build();
        return ResponseEntity.ok(orderService.getRetailerOrders(principal.getName()));
    }

    @GetMapping("/received-orders") // For Farmer
    public ResponseEntity<List<Order>> getReceivedOrders(Principal principal) {
        if (principal == null)
            return ResponseEntity.status(401).build();
        return ResponseEntity.ok(orderService.getFarmerOrders(principal.getName()));
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
            // Security check should be in service, but for now assuming Farmer is
            // authorized
            // if they own the product. Service handles logic.
            Order order = orderService.updateOrderStatus(id, newStatus);
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

package com.farmerretailer.controller;

import com.farmerretailer.entity.Transport;
import com.farmerretailer.service.TransportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/transport")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class TransportController {

    @Autowired
    private TransportService transportService;

    @PostMapping("/platform")
    public ResponseEntity<?> createPlatformTransport(@RequestBody Map<String, Object> payload) {
        try {
            Long orderId = Long.valueOf(payload.get("orderId").toString());
            Double distanceKm = Double.valueOf(payload.get("distanceKm").toString());
            Transport transport = transportService.createPlatformTransport(orderId, distanceKm);
            return ResponseEntity.ok(transport);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/own")
    public ResponseEntity<?> createOwnTransport(@RequestBody Map<String, Object> payload) {
        try {
            Long orderId = Long.valueOf(payload.get("orderId").toString());
            Transport transport = transportService.createOwnTransport(orderId);
            return ResponseEntity.ok(transport);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PutMapping("/{id}/confirm")
    public ResponseEntity<?> confirmTransport(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(transportService.confirmTransport(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/available")
    public ResponseEntity<List<Transport>> getAvailable() {
        return ResponseEntity.ok(transportService.getAvailableRequests());
    }

    @PutMapping("/{id}/accept")
    public ResponseEntity<?> acceptTransport(@PathVariable Long id, Principal principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        try {
            return ResponseEntity.ok(transportService.acceptTransport(id, principal.getName()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        try {
            return ResponseEntity.ok(transportService.updateStatus(id, payload.get("status")));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PutMapping("/location")
    public ResponseEntity<?> updateLocation(@RequestBody Map<String, Double> payload, Principal principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        try {
            transportService.updateDriverLocation(principal.getName(), payload.get("lat"), payload.get("lng"));
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<?> getTransportByOrder(@PathVariable Long orderId) {
        return transportService.getTransportByOrderId(orderId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/my-deliveries")
    public ResponseEntity<List<Transport>> getMyDeliveries(Principal principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(transportService.getMyDeliveries(principal.getName()));
    }
}

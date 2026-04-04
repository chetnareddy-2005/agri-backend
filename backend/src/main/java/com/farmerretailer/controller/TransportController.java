package com.farmerretailer.controller;

import com.farmerretailer.entity.Transport;
import com.farmerretailer.service.TransportService;
import com.farmerretailer.service.CrisisService;
import com.farmerretailer.service.AllocationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/transport")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176"}, allowCredentials = "true")
public class TransportController {

    @Autowired
    private TransportService transportService;

    @Autowired
    private CrisisService crisisService;
    
    @Autowired
    private AllocationService allocationService;

    @GetMapping("/recommended-drivers")
    public ResponseEntity<List<TransportService.ScoredDriver>> getRecommendedDrivers(@RequestParam(defaultValue = "0") double lat, @RequestParam(defaultValue = "0") double lng) {
        return ResponseEntity.ok(transportService.getRecommendedDrivers(lat, lng));
    }

    @GetMapping("/drivers")
    public ResponseEntity<List<com.farmerretailer.entity.Driver>> getAvailableDrivers() {
        return ResponseEntity.ok(transportService.getAvailableDrivers());
    }

    @PostMapping("/select")
    public ResponseEntity<?> selectDriver(@RequestBody Map<String, Object> payload) {
        try {
            Long orderId = Long.valueOf(payload.get("orderId").toString());
            Double distanceKm = Double.valueOf(payload.get("distanceKm").toString());
            Long driverId = Long.valueOf(payload.get("driverId").toString());
            String scheduledDate = (String) payload.get("scheduledDate");
            String timeSlot = (String) payload.get("timeSlot");
            
            Transport transport = transportService.createPlatformTransport(orderId, distanceKm, driverId, scheduledDate, timeSlot);
            return ResponseEntity.ok(transport);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/rate")
    public ResponseEntity<?> submitRating(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        try {
            Double rating = Double.valueOf(payload.get("rating").toString());
            String fromRole = payload.get("fromRole").toString(); // RETAILER, TRANSPORTER
            return ResponseEntity.ok(transportService.submitRating(id, rating, fromRole));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/delivery-proof")
    public ResponseEntity<?> submitProof(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        try {
            String photoUrl = payload.get("photoUrl");
            String signature = payload.get("signature");
            return ResponseEntity.ok(transportService.submitDeliveryProof(id, photoUrl, signature));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PutMapping("/{id}/negotiate")
    public ResponseEntity<?> negotiatePrice(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        try {
            Double newPrice = Double.valueOf(payload.get("newPrice").toString());
            String changedBy = payload.get("changedBy").toString(); // RETAILER or TRANSPORTER
            return ResponseEntity.ok(transportService.negotiatePrice(id, newPrice, changedBy));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PutMapping("/{id}/accept-negotiation")
    public ResponseEntity<?> acceptNegotiation(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        try {
            String acceptedBy = payload.get("acceptedBy").toString();
            return ResponseEntity.ok(transportService.acceptNegotiation(id, acceptedBy));
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

    // --- NEW AI MODULE ENDPOINTS ---
        
    @GetMapping("/crisis")
    public ResponseEntity<?> getActiveCrises(@RequestParam String location) {
        return ResponseEntity.ok(crisisService.getActiveCrisesForLocation(location));
    }

    @PostMapping("/crisis/road-block")
    public ResponseEntity<?> triggerRoadBlock(@RequestBody Map<String, String> payload) {
        crisisService.triggerRoadBlockage(payload.get("location"), payload.get("message"));
        return ResponseEntity.ok().build();
    }

    @GetMapping("/allocation-insights")
    public ResponseEntity<?> getInsights(@RequestParam String destination) {
        return ResponseEntity.ok(allocationService.getOptimizedAssignments(destination));
    }
}

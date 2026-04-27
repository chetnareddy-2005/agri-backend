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
@org.springframework.transaction.annotation.Transactional
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

    @PostMapping(value = "/{id}/delivery-proof", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> submitProof(
            @PathVariable Long id, 
            @RequestParam("image") org.springframework.web.multipart.MultipartFile image,
            @RequestParam("signature") org.springframework.web.multipart.MultipartFile signature) {
        try {
            // Save Photo
            String photoFileName = "proof_" + id + "_" + System.currentTimeMillis() + ".jpg";
            java.nio.file.Path photoPath = java.nio.file.Paths.get("uploads/proofs/" + photoFileName);
            java.nio.file.Files.createDirectories(photoPath.getParent());
            java.nio.file.Files.copy(image.getInputStream(), photoPath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            String photoUrl = "/uploads/proofs/" + photoFileName;
            
            // Save Signature
            String signFileName = "sign_" + id + "_" + System.currentTimeMillis() + ".png";
            java.nio.file.Path signPath = java.nio.file.Paths.get("uploads/proofs/" + signFileName);
            java.nio.file.Files.copy(signature.getInputStream(), signPath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            String signatureUrl = "/uploads/proofs/" + signFileName;
            
            return ResponseEntity.ok(transportService.submitDeliveryProof(id, photoUrl, signatureUrl));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error saving proof: " + e.getMessage());
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

    @GetMapping("/driver-info")
    public ResponseEntity<com.farmerretailer.entity.Driver> getDriverInfo(Principal principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        try {
            return ResponseEntity.ok(transportService.getDriverInfo(principal.getName()));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
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

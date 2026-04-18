package com.farmerretailer.controller;

import com.farmerretailer.entity.Bid;
import com.farmerretailer.service.BidService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bids")
public class BidController {

    @Autowired
    private BidService bidService;

    @PostMapping("/place")
    public ResponseEntity<?> placeBid(@RequestBody Map<String, Object> payload, Principal principal) {
        if (principal == null)
            return ResponseEntity.status(401).build();

        try {
            Long productId = Long.valueOf(payload.get("productId").toString());
            Double amount = Double.valueOf(payload.get("amount").toString());

            Bid bid = bidService.placeBid(productId, amount, principal.getName());
            return ResponseEntity.ok(bid);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<List<Bid>> getProductBids(@PathVariable Long productId) {
        return ResponseEntity.ok(bidService.getProductBids(productId));
    }

    @GetMapping("/highest/{productId}")
    public ResponseEntity<Double> getHighestBid(@PathVariable Long productId) {
        Double highest = bidService.getHighestBid(productId);
        return ResponseEntity.ok(highest != null ? highest : 0.0);
    }

    @GetMapping("/my-bids")
    public ResponseEntity<List<Bid>> getMyBids(Principal principal) {
        if (principal == null)
            return ResponseEntity.status(401).build();
        return ResponseEntity.ok(bidService.getMyBids(principal.getName()));
    }

    @PostMapping("/accept/{bidId}")
    public ResponseEntity<?> acceptBid(@PathVariable Long bidId) { // Verify authorization via Principal if needed
        try {
            bidService.acceptBid(bidId);
            return ResponseEntity.ok("Bid accepted successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
}

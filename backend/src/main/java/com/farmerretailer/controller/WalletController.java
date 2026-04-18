package com.farmerretailer.controller;

import com.farmerretailer.entity.User;
import com.farmerretailer.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/wallet")
public class WalletController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/balance")
    public ResponseEntity<Map<String, Double>> getBalance(java.security.Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        String email = principal.getName();
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return ResponseEntity.status(401).build();
        }

        Map<String, Double> balance = new HashMap<>();
        balance.put("availableBalance", user.getAvailableBalance() != null ? user.getAvailableBalance() : 0.0);
        balance.put("escrowBalance", user.getEscrowBalance() != null ? user.getEscrowBalance() : 0.0);
        return ResponseEntity.ok(balance);
    }
}

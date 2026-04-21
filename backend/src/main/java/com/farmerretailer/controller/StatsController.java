package com.farmerretailer.controller;

import com.farmerretailer.entity.User;
import com.farmerretailer.repository.OrderRepository;
import com.farmerretailer.repository.ProductRepository;
import com.farmerretailer.repository.UserRepository;
import com.farmerretailer.service.StatsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/stats")
public class StatsController {

    @Autowired
    private StatsService statsService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private OrderRepository orderRepository;

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboardStats(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(statsService.getUserStats(principal.getName()));
    }

    @GetMapping("/farmer/stats")
    public ResponseEntity<Map<String, Object>> getFarmerStats(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName()).orElse(null);
        if (user == null)
            return ResponseEntity.badRequest().build();

        long listings = productRepository.countByFarmerId(user.getId());
        Double totalSales = orderRepository.sumTotalSalesByFarmerId(user.getId());
        if (totalSales == null)
            totalSales = 0.0;

        long pendingOrders = orderRepository.countPendingByFarmerId(user.getId());
        long activeOrders = orderRepository.countActiveByFarmerId(user.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("listings", listings);
        response.put("totalSales", totalSales);
        response.put("pendingOrders", pendingOrders);
        response.put("activeOrders", activeOrders);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/farmer/monthly-sales")
    public ResponseEntity<List<Map<String, Object>>> getFarmerMonthlySales(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName()).orElse(null);
        if (user == null)
            return ResponseEntity.badRequest().build();

        List<Object[]> results = orderRepository.findMonthlySalesByFarmerId(user.getId());
        List<Map<String, Object>> chartData = new ArrayList<>();

        // Month names array (1-indexed for convenience)
        String[] months = { "", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" };

        // Initialize map with all months 0.0
        Map<Integer, Double> salesMap = new HashMap<>();
        for (int i = 1; i <= 12; i++) {
            salesMap.put(i, 0.0);
        }

        // Fill with db data
        for (Object[] row : results) {
            int month = (int) row[0];
            double sales = (double) row[1];
            salesMap.put(month, sales);
        }

        // Convert to list for frontend (e.g., Jan to Dec or dynamically last 6 months?
        // User asked to fix "showing January", implies wanting full year or relevant
        // range.
        // Let's return full year Jan-Dec for simplicity as per the chart axis in
        // screenshot)
        chartData.clear();
        for (int i = 1; i <= 12; i++) {
            Map<String, Object> item = new HashMap<>();
            item.put("name", months[i]);
            item.put("sales", salesMap.get(i));
            chartData.add(item);
        }

        return ResponseEntity.ok(chartData);
    }
}

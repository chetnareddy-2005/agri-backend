package com.farmerretailer.service;

import com.farmerretailer.entity.User;
import com.farmerretailer.model.Role;
import com.farmerretailer.repository.OrderRepository;
import com.farmerretailer.repository.ProductRepository;
import com.farmerretailer.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class StatsService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private com.farmerretailer.repository.BidRepository bidRepository;

    public Map<String, Object> getUserStats(String email) {
        Map<String, Object> stats = new HashMap<>();
        Optional<User> userOpt = userRepository.findByEmail(email);

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            Long userId = user.getId();

            if (user.getRole() == Role.FARMER) {
                // Add Profile Details to refresh frontend state
                stats.put("userProfile", new java.util.HashMap<String, Object>() {
                    {
                        put("fullName", user.getFullName());
                        put("email", user.getEmail());
                        put("mobileNumber", user.getMobileNumber());
                        put("address", user.getAddress());
                        put("businessName", user.getBusinessName()); // Farm Name
                        put("documentName", user.getDocumentName());
                        put("description", user.getDescription());
                    }
                });

                stats.put("listings", productRepository.countByFarmerId(userId));
                stats.put("pendingOrders", orderRepository.countPendingByFarmerId(userId));

                Double totalSales = orderRepository.sumTotalSalesByFarmerId(userId);
                stats.put("totalSales", totalSales != null ? totalSales : 0.0);

                // --- Dynamic Graphs for Farmer ---

                // 1. Produce Mix
                List<Object[]> mixDataRaw = productRepository.countProductsByCategory(userId);
                List<Map<String, Object>> produceMix = new java.util.ArrayList<>();
                Map<String, String> categoryColors = new java.util.HashMap<>();
                categoryColors.put("Vegetables", "#2E7D32");
                categoryColors.put("Fruits", "#81C784");
                categoryColors.put("Grains", "#E4C07C");
                categoryColors.put("Pulses", "#AED581");

                for (Object[] row : mixDataRaw) {
                    String category = (String) row[0];
                    long count = ((Number) row[1]).longValue();
                    Map<String, Object> item = new java.util.HashMap<>();
                    item.put("name", category);
                    item.put("value", count);
                    item.put("color", categoryColors.getOrDefault(category, "#CCCCCC"));
                    produceMix.add(item);
                }
                stats.put("mixData", produceMix);

                // 2. Monthly Sales
                List<Object[]> salesDataRaw = orderRepository.findMonthlySalesByFarmerId(userId);
                List<Map<String, Object>> salesData = new java.util.ArrayList<>();
                String[] monthNames = { "", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov",
                        "Dec" };

                for (Object[] row : salesDataRaw) {
                    int month = ((Number) row[0]).intValue();
                    double total = ((Number) row[1]).doubleValue();
                    Map<String, Object> point = new java.util.HashMap<>();
                    point.put("name", month >= 1 && month <= 12 ? monthNames[month] : "Unknown");
                    point.put("sales", total);
                    salesData.add(point);
                }
                stats.put("salesData", salesData);
            } else if (user.getRole() != null && (user.getRole() == Role.RETAILER || String.valueOf(user.getRole()).equalsIgnoreCase("RETAILER"))) {
                // Add Profile Details for Retailer as well
                stats.put("userProfile", new java.util.HashMap<String, Object>() {
                    {
                        put("fullName", user.getFullName());
                        put("email", user.getEmail());
                        put("mobileNumber", user.getMobileNumber());
                        put("address", user.getAddress());
                        put("businessName", user.getBusinessName());
                        put("description", user.getDescription());
                        put("documentName", user.getDocumentName());
                    }
                });

                // Optimized: Use direct counts for speed and reliability
                stats.put("totalOrders", orderRepository.countByRetailerId(userId));
                stats.put("pendingOrders", orderRepository.countPendingByRetailerId(userId));
                stats.put("activeOrders", orderRepository.countActiveByRetailerId(userId));
                stats.put("deliveredOrders", orderRepository.countDeliveredByRetailerId(userId));

                // New Quick Stats
                stats.put("activeBids", bidRepository.countActiveBids(userId));
                stats.put("pendingShipments", orderRepository.countPendingByRetailerId(userId));

                // Optimized Avg Delivery Days Calculation
                Double avgDays = orderRepository.calculateAvgDeliveryDaysByRetailerId(userId);
                stats.put("avgDeliveryDays", avgDays != null ? String.format("%.1f", avgDays) : "0.0");

                // --- Dynamic Graphs Data ---

                // 1. Orders Over Time (Monthly) - Last 6 Months
                List<Map<String, Object>> ordersOverTime = new java.util.ArrayList<>();
                String[] monthNames = { "", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov",
                        "Dec" };

                try {
                    List<Object[]> monthlyData = orderRepository.findOrdersGroupedByMonth(userId);
                    // Create a map for easy lookup of DB results: MonthIndex -> Count
                    Map<Integer, Long> dbDataMap = new HashMap<>();
                    for (Object[] row : monthlyData) {
                        if (row != null && row.length >= 2 && row[0] != null) {
                            dbDataMap.put(((Number) row[0]).intValue(), ((Number) row[1]).longValue());
                        }
                    }

                    // Generate last 6 months data
                    java.time.LocalDate now = java.time.LocalDate.now();
                    for (int i = 5; i >= 0; i--) {
                        java.time.LocalDate date = now.minusMonths(i);
                        int monthIndex = date.getMonthValue();
                        String monthName = monthNames[monthIndex];

                        Map<String, Object> point = new HashMap<>();
                        point.put("name", monthName);
                        point.put("value", dbDataMap.getOrDefault(monthIndex, 0L));
                        ordersOverTime.add(point);
                    }
                } catch (Exception e) {
                    System.err.println("Error calculating ordersOverTime: " + e.getMessage());
                }
                stats.put("ordersOverTime", ordersOverTime);

                // 2. Order Status Distribution
                List<Map<String, Object>> orderStatusData = new java.util.ArrayList<>();
                try {
                    List<Object[]> statusData = orderRepository.findOrdersGroupedByStatus(userId);
                    // Define colors for statuses
                    Map<String, String> statusColors = new java.util.HashMap<>();
                    statusColors.put("PENDING", "#FBBF24"); // Amber
                    statusColors.put("CONFIRMED", "#3B82F6"); // Blue
                    statusColors.put("SHIPPED", "#8B5CF6"); // Purple
                    statusColors.put("DELIVERED", "#10B981"); // Green
                    statusColors.put("RECEIVED", "#047857"); // Darker Green
                    statusColors.put("CANCELLED", "#EF4444"); // Red

                    for (Object[] row : statusData) {
                        if (row != null && row.length >= 2 && row[0] != null) {
                            String status = (String) row[0];
                            long statusCount = ((Number) row[1]).longValue();
                            Map<String, Object> item = new java.util.HashMap<>();
                            item.put("name", status);
                            item.put("value", statusCount);
                            item.put("color", statusColors.getOrDefault(status, "#9CA3AF")); // Gray default
                            orderStatusData.add(item);
                        }
                    }
                } catch (Exception e) {
                    System.err.println("Error calculating orderStatusData: " + e.getMessage());
                }
                stats.put("orderStatusData", orderStatusData);
            } else {
                System.err.println("StatsService: UNKNOWN ROLE for user " + userId + ": " + user.getRole());
            }
        }
        return stats;
    }
}

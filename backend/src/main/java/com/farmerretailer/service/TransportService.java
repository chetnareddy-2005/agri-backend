package com.farmerretailer.service;

import com.farmerretailer.entity.Driver;
import com.farmerretailer.entity.Order;
import com.farmerretailer.entity.Product;
import com.farmerretailer.entity.Transport;
import com.farmerretailer.entity.User;
import com.farmerretailer.entity.Weather;
import com.farmerretailer.repository.DriverRepository;
import com.farmerretailer.repository.OrderRepository;
import com.farmerretailer.repository.TransportRepository;
import com.farmerretailer.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@org.springframework.transaction.annotation.Transactional
public class TransportService {
    
    public static class ScoredDriver {
        public Driver driver;
        public double score;
        public double estimatedPrice;
        public String recommendationReason;
        public String tag; // BEST, FASTEST, CHEAPEST
        public double distance;
    }

    @Autowired
    private TransportRepository transportRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private DriverRepository driverRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WeatherService weatherService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private PaymentService paymentService;

    public Transport createPlatformTransport(Long orderId, Double distanceKm, Long driverId, String scheduledDate, String timeSlot) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new RuntimeException("Driver not found"));

        Transport transport = new Transport();
        transport.setOrder(order);
        transport.setDriver(driver);
        transport.setTransportMethod("PLATFORM");
        transport.setDistanceKm(distanceKm);
        
        if (scheduledDate != null && !scheduledDate.isEmpty()) {
            transport.setScheduledDate(java.time.LocalDate.parse(scheduledDate));
            transport.setTimeSlot(timeSlot);
            transport.setStatus("SCHEDULED");
        } else {
            transport.setStatus("PENDING");
        }

        // Real Weather Intelligence logic
        String city = (order.getProduct() != null && order.getProduct().getFarmer() != null) ? order.getProduct().getFarmer().getBusinessName() : "Hyderabad"; 
        Weather w = weatherService.getLatestWeather(city);
        
        double baseFare = 20.0;
        double perKmRate = ("Auto".equalsIgnoreCase(driver.getVehicleType())) ? 8.0 : ("Truck".equalsIgnoreCase(driver.getVehicleType()) ? 12.0 : 5.0);
        
        double surgeMultiplier = 1.0;
        double weatherMultiplier = 1.0;
        StringBuilder reason = new StringBuilder();

        // Weather impact on pricing
        if (w != null && w.getWeatherCondition().toLowerCase().contains("rain")) {
            weatherMultiplier = 1.25; // 25% Weather Surge
            reason.append("🌦️ Rainy Weather Surcharge (+25%) ");
        }

        double aiPrice = (baseFare + (perKmRate * distanceKm)) * surgeMultiplier * weatherMultiplier;
        
        transport.setSurgeMultiplier(surgeMultiplier);
        transport.setWeatherMultiplier(weatherMultiplier);
        transport.setPriceReason(reason.toString().trim().isEmpty() ? "Standard AI Price" : reason.toString().trim());
        
        transport.setInitialPrice(aiPrice);
        transport.setUpdatedPrice(aiPrice);
        transport.setSuggestedVehicle(driver.getVehicleType());
        transport.setConfirmedByRetailer(true);
        transport.setPriceAcceptedByRetailer(true); // Retailer accepts their own AI-generated price upon selection

        driver.setTotalRequests((driver.getTotalRequests() != null ? driver.getTotalRequests() : 0) + 1);
        driverRepository.save(driver);

        return transportRepository.save(transport);
    }

    public List<Driver> getAvailableDrivers() {
        return driverRepository.findByIsAvailableTrue();
    }

    public List<Driver> getAllTransporters() {
        return driverRepository.findAll();
    }

    public Transport submitRating(Long transportId, Double rating, String fromRole) {
        Transport transport = transportRepository.findById(transportId)
                .orElseThrow(() -> new RuntimeException("Transport not found"));
        
        if ("RETAILER".equals(fromRole)) {
            transport.setRetailerToTransporterRating(rating);
            // Dynamic rating update for Driver
            Driver driver = transport.getDriver();
            if (driver != null) {
                double oldRating = driver.getRating() != null ? driver.getRating() : 4.5;
                int total = driver.getDeliveredRequests() != null ? driver.getDeliveredRequests() : 0;
                driver.setRating(((oldRating * total) + rating) / (total + 1));
                
                // Gamification points
                driver.setPoints((driver.getPoints() != null ? driver.getPoints() : 0) + 10);
                if (driver.getPoints() > 500) driver.setBadge("GOLD");
                else if (driver.getPoints() > 200) driver.setBadge("SILVER");
                
                driverRepository.save(driver);
            }
        } else {
            transport.setTransporterToRetailerRating(rating);
        }
        return transportRepository.save(transport);
    }

    public Transport submitDeliveryProof(Long transportId, String photoUrl, String signatureUrl) {
        Transport transport = transportRepository.findById(transportId)
                .orElseThrow(() -> new RuntimeException("Transport not found"));
        transport.setDeliveryPhotoUrl(photoUrl);
        transport.setSignatureUrl(signatureUrl);
        transport.setStatus("DELIVERED");
        
        Driver d = transport.getDriver();
        if (d != null) {
            d.setDeliveredRequests((d.getDeliveredRequests() != null ? d.getDeliveredRequests() : 0) + 1);
            d.setAvailable(true);
            driverRepository.save(d);
        }

        // SYNC with Order Status
        if (transport.getOrder() != null) {
            Order order = transport.getOrder();
            order.setStatus("DELIVERED");
            order.setPaid(true); // Mark as paid upon delivery proof
            order.setDeliveredAt(java.time.LocalDateTime.now());
            orderRepository.save(order);
            
            // Release funds from escrow
            paymentService.settleEscrowFunds(order.getId());
        }
        
        return transportRepository.save(transport);
    }

    public List<ScoredDriver> getRecommendedDrivers(double retailerLat, double retailerLng) {
        List<Driver> availableDrivers = driverRepository.findByIsAvailableTrue();
        List<ScoredDriver> scoredDrivers = availableDrivers.stream().map(d -> {
            ScoredDriver sd = new ScoredDriver();
            sd.driver = d;
            
            // Default price calculation (AI Price)
            double perKmRate = ("Auto".equalsIgnoreCase(d.getVehicleType())) ? 8.0 : ("Truck".equalsIgnoreCase(d.getVehicleType()) ? 12.0 : 5.0);
            
            // Simple distance from (0,0) or retailer location
            double distance = calculateDistance(retailerLat, retailerLng, d.getCurrentLat() != null ? d.getCurrentLat() : 0, d.getCurrentLng() != null ? d.getCurrentLng() : 0);
            sd.distance = distance;
            sd.estimatedPrice = 20.0 + (perKmRate * distance);
            
            // Score formula: high rating, low distance, low price
            // weight normalized scores (0 to 1) roughly
            double ratingScore = (d.getRating() != null ? d.getRating() : 4.0) / 5.0;
            double distanceScore = (distance < 1) ? 1.0 : (1.0 / distance);
            double priceScore = (sd.estimatedPrice < 1) ? 1.0 : (100.0 / sd.estimatedPrice);
            
            sd.score = (ratingScore * 0.4) + (distanceScore * 0.4) + (priceScore * 0.2);
            
            StringBuilder reason = new StringBuilder();
            if (distance < 2) reason.append("Closest to location");
            if (d.getRating() >= 4.8) {
                if (reason.length() > 0) reason.append(" + ");
                reason.append("Top-rated driver");
            }
            if (sd.estimatedPrice < 50) {
                if (reason.length() > 0) reason.append(" + ");
                reason.append("Low cost efficiency");
            }
            if (reason.length() == 0) reason.append("Balanced Choice");
            
            sd.recommendationReason = reason.toString();
            return sd;
        }).collect(Collectors.toList());

        // Tagging
        if (!scoredDrivers.isEmpty()) {
            // BEST
            scoredDrivers.stream().max((a, b) -> Double.compare(a.score, b.score)).ifPresent(s -> s.tag = "BEST");
            // FASTEST (min distance)
            scoredDrivers.stream().min((a, b) -> Double.compare(a.distance, b.distance)).ifPresent(s -> s.tag = "FASTEST");
            scoredDrivers.stream().min((a, b) -> Double.compare(a.estimatedPrice, b.estimatedPrice)).ifPresent(s -> s.tag = "CHEAPEST");
        }

        return scoredDrivers.stream()
                .sorted((a, b) -> Double.compare(b.score, a.score))
                .collect(Collectors.toList());
    }

    public Transport negotiatePrice(Long transportId, Double newPrice, String changedBy) {
        Transport transport = transportRepository.findById(transportId)
                .orElseThrow(() -> new RuntimeException("Transport not found"));
        
        transport.setUpdatedPrice(newPrice);
        transport.setPriceChangedBy(changedBy);
        transport.setStatus("PRICE_UPDATED");
        
        if ("RETAILER".equals(changedBy)) {
            transport.setPriceAcceptedByRetailer(true);
            transport.setPriceAcceptedByTransporter(false);
        } else {
            transport.setPriceAcceptedByTransporter(true);
            transport.setPriceAcceptedByRetailer(false);
        }
        
        Transport saved = transportRepository.save(transport);
        
        // Notify the other party
        if ("TRANSPORTER".equals(changedBy)) {
            notificationService.createNotification(
                transport.getOrder().getRetailer(),
                "💰 Logistics Price Update",
                "The transporter has proposed a new price: ₹" + newPrice + " for Order #" + transport.getOrder().getId(),
                "info",
                transport.getId()
            );
        } else if (transport.getDriver() != null && transport.getDriver().getUser() != null) {
            notificationService.createNotification(
                transport.getDriver().getUser(),
                "💰 Logistics Price Counter",
                "The retailer has proposed a new price: ₹" + newPrice + " for Order #" + transport.getOrder().getId(),
                "info",
                transport.getId()
            );
        }
        
        return saved;
    }

    public Transport acceptNegotiation(Long transportId, String acceptedBy) {
        Transport transport = transportRepository.findById(transportId)
                .orElseThrow(() -> new RuntimeException("Transport not found"));
        
        if ("RETAILER".equals(acceptedBy)) transport.setPriceAcceptedByRetailer(true);
        else transport.setPriceAcceptedByTransporter(true);

        if ((transport.isPriceAcceptedByRetailer() || transport.isConfirmedByRetailer()) && transport.isPriceAcceptedByTransporter()) {
            transport.setStatus("ACCEPTED");
            if (transport.getDriver() != null) {
                Driver d = transport.getDriver();
                d.setAvailable(false);
                d.setAcceptedRequests((d.getAcceptedRequests() != null ? d.getAcceptedRequests() : 0) + 1);
                driverRepository.save(d);
                
                // NOTIFY RETAILER
                notificationService.createNotification(
                    transport.getOrder().getRetailer(),
                    "✅ Logistics Confirmed",
                    "The price negotiation for Order #" + transport.getOrder().getId() + " is complete. Delivery is scheduled.",
                    "success",
                    transport.getId()
                );
                
                // NOTIFY TRANSPORTER WITH FULL DETAILS
                User retailer = transport.getOrder().getRetailer();
                User farmer = transport.getOrder().getProduct().getFarmer();
                Product product = transport.getOrder().getProduct();

                String transporterMsg = String.format(
                    "✅ Order #%d Assigned! \n\n" +
                    "📍 PICKUP (Farmer): %s (%s), %s, %s, %s. [📞 %s]\n\n" +
                    "🏁 DELIVERY (Retailer): %s (%s), %s, %s, %s. [📞 %s]\n\n" +
                    "📦 Items: %.1f %s of %s.",
                    transport.getOrder().getId(),
                    farmer.getFullName(), farmer.getBusinessName() != null ? farmer.getBusinessName() : "Farm",
                    product.getLocation() != null ? product.getLocation() : farmer.getAddress(),
                    farmer.getCity(), farmer.getState(), farmer.getMobileNumber(),
                    retailer.getFullName(), retailer.getBusinessName() != null ? retailer.getBusinessName() : "Store",
                    retailer.getAddress(), retailer.getCity(), retailer.getState(), retailer.getMobileNumber(),
                    transport.getOrder().getQuantity(), product.getUnit(), product.getName()
                );

                notificationService.createNotification(
                    d.getUser(),
                    "📦 Logistics Mission Assigned",
                    transporterMsg,
                    "success",
                    transport.getId()
                );
                
                // NEW: NOTIFY FARMER with Transporter Details
                if (transport.getOrder().getProduct() != null && farmer != null) {
                    String driverName = d.getUser() != null ? d.getUser().getFullName() : "Assigned Driver";
                    String vehicleInfo = d.getVehicleType() != null ? d.getVehicleType() : "Vehicle";
                    notificationService.createNotification(
                        farmer,
                        "🚚 Transporter Assigned",
                        "A transporter has been assigned to pickup Order #" + transport.getOrder().getId() + ". Driver: " + driverName + " (" + vehicleInfo + ").",
                        "info",
                        transport.getId()
                    );
                }
            }
        }
        return transportRepository.save(transport);
    }

    public List<Transport> getAvailableRequests() {
        return transportRepository.findByStatus("PENDING").stream()
                .filter(Transport::isConfirmedByRetailer)
                .filter(t -> t.getOrder() != null && "SHIPPED".equalsIgnoreCase(t.getOrder().getStatus()))
                .toList();
    }

    public Transport acceptTransport(Long transportId, String driverEmail) {
        Transport transport = transportRepository.findById(transportId)
                .orElseThrow(() -> new RuntimeException("Transport request not found"));
        User user = userRepository.findByEmail(driverEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Driver driver = driverRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Driver profile not found"));
        transport.setDriver(driver);
        transport.setStatus("ACCEPTED");
        driver.setAvailable(false);
        driverRepository.save(driver);
        
        // Optionally update order status to PICKED_UP or similar if needed
        // but user only mentioned PENDING, SHIPPED, and then DELIVERED.
        
        return transportRepository.save(transport);
    }
    
    public Transport updateStatus(Long transportId, String status) {
        Transport transport = transportRepository.findById(transportId)
            .orElseThrow(() -> new RuntimeException("Transport not found"));
        
        String upperStatus = status.toUpperCase();
        transport.setStatus(upperStatus);
        
        if ("DELIVERED".equals(upperStatus) && transport.getDriver() != null) {
            Driver d = transport.getDriver();
            d.setAvailable(true);
            d.setDeliveredRequests((d.getDeliveredRequests() != null ? d.getDeliveredRequests() : 0) + 1);
            d.setPoints((d.getPoints() != null ? d.getPoints() : 0) + 20); 
            driverRepository.save(d);
            
            // SYNC with Order Status
            if (transport.getOrder() != null) {
                Order order = transport.getOrder();
                order.setStatus("DELIVERED");
                order.setPaid(true);
                order.setDeliveredAt(java.time.LocalDateTime.now());
                orderRepository.save(order);
                
                paymentService.settleEscrowFunds(order.getId());
            }
        }
        return transportRepository.save(transport);
    }

    public void updateDriverLocation(String driverEmail, Double lat, Double lng) {
        User user = userRepository.findByEmail(driverEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Driver driver = driverRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Driver profile not found"));
        driver.setCurrentLat(lat); driver.setCurrentLng(lng);
        driverRepository.save(driver);
    }
    
    public Optional<Transport> getTransportByOrderId(Long orderId) {
        return transportRepository.findByOrderId(orderId);
    }
    
    public List<Transport> getMyDeliveries(String driverEmail) {
        User user = userRepository.findByEmail(driverEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Driver driver = driverRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Driver profile not found"));
        return transportRepository.findByDriverId(driver.getId());
    }

    public Driver getDriverInfo(String driverEmail) {
        User user = userRepository.findByEmail(driverEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return driverRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Driver profile not found"));
    }

    public double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        double R = 6371; // km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}

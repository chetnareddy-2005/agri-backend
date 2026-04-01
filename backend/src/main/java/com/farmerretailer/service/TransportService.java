package com.farmerretailer.service;

import com.farmerretailer.entity.Driver;
import com.farmerretailer.entity.Order;
import com.farmerretailer.entity.Transport;
import com.farmerretailer.entity.User;
import com.farmerretailer.repository.DriverRepository;
import com.farmerretailer.repository.OrderRepository;
import com.farmerretailer.repository.TransportRepository;
import com.farmerretailer.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.Random;

@Service
public class TransportService {

    @Autowired
    private TransportRepository transportRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private DriverRepository driverRepository;

    @Autowired
    private UserRepository userRepository;

    public Transport createPlatformTransport(Long orderId, Double distanceKm) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        Transport transport = new Transport();
        transport.setOrder(order);
        transport.setTransportMethod("PLATFORM");
        transport.setDistanceKm(distanceKm);
        
        // Simple AI logic to suggest vehicle
        Double quantity = order.getQuantity();
        if (quantity <= 50) {
            transport.setSuggestedVehicle("Bike");
        } else if (quantity <= 500) {
            transport.setSuggestedVehicle("Auto");
        } else {
            transport.setSuggestedVehicle("Truck");
        }

        // Calculate suggested price (e.g. Base Rs. 50 + distance * rate)
        double ratePerKm = 10.0;
        if (transport.getSuggestedVehicle().equals("Auto")) ratePerKm = 20.0;
        if (transport.getSuggestedVehicle().equals("Truck")) ratePerKm = 40.0;
        
        transport.setPrice(50.0 + (distanceKm * ratePerKm));
        transport.setStatus("PENDING");
        transport.setConfirmedByRetailer(true);

        return transportRepository.save(transport);
    }

    public Transport createOwnTransport(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        Transport transport = new Transport();
        transport.setOrder(order);
        transport.setTransportMethod("OWN");
        transport.setStatus("ACCEPTED");
        return transportRepository.save(transport);
    }
    
    public Transport confirmTransport(Long transportId) {
         Transport transport = transportRepository.findById(transportId)
                .orElseThrow(() -> new RuntimeException("Transport request not found"));
         transport.setConfirmedByRetailer(true);
         return transportRepository.save(transport);
    }

    public List<Transport> getAvailableRequests() {
        // Return confirmed pending requests
        return transportRepository.findByStatus("PENDING").stream()
                .filter(Transport::isConfirmedByRetailer).toList();
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

        return transportRepository.save(transport);
    }
    
    public Transport updateStatus(Long transportId, String status) {
        Transport transport = transportRepository.findById(transportId)
            .orElseThrow(() -> new RuntimeException("Transport not found"));
        transport.setStatus(status);
        if ("DELIVERED".equals(status) && transport.getDriver() != null) {
            transport.getDriver().setAvailable(true);
            driverRepository.save(transport.getDriver());
        }
        return transportRepository.save(transport);
    }

    public void updateDriverLocation(String driverEmail, Double lat, Double lng) {
        User user = userRepository.findByEmail(driverEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Driver driver = driverRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Driver profile not found"));

        driver.setCurrentLat(lat);
        driver.setCurrentLng(lng);
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
        
        return transportRepository.findByDriverId(driver.getId()).stream()
                .filter(t -> !"DELIVERED".equals(t.getStatus()))
                .toList();
    }
}

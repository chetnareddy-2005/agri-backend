package com.farmerretailer.service;

import com.farmerretailer.entity.Feedback;
import com.farmerretailer.entity.Order;
import com.farmerretailer.entity.User;
import com.farmerretailer.repository.FeedbackRepository;
import com.farmerretailer.repository.OrderRepository;
import com.farmerretailer.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FeedbackService {

    @Autowired
    private FeedbackRepository feedbackRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationService notificationService;

    public Feedback submitFeedback(Long orderId, Integer rating, String comment, String retailerEmail) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (!order.getRetailer().getEmail().equals(retailerEmail)) {
            throw new RuntimeException("Unauthorized");
        }

        if (!"DELIVERED".equals(order.getStatus())) {
            throw new RuntimeException("Order is not delivered yet");
        }

        if (feedbackRepository.existsByOrderId(orderId)) {
            throw new RuntimeException("Feedback already submitted for this order");
        }

        Feedback feedback = new Feedback(order, rating, comment);
        Feedback savedFeedback = feedbackRepository.save(feedback);

        // Notify Farmer
        User farmer = order.getProduct().getFarmer();
        notificationService.createNotification(
                farmer,
                "New Feedback",
                "You received a " + rating + "-star rating for " + order.getProduct().getName(),
                "feedback",
                savedFeedback.getId());

        return savedFeedback;
    }

    public List<Order> getPendingFeedbackOrders(String retailerEmail) {
        User retailer = userRepository.findByEmail(retailerEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return orderRepository.findOrdersPendingFeedback(retailer.getId());
    }

    public List<Feedback> getFeedbacksForFarmer(String farmerEmail) {
        User farmer = userRepository.findByEmail(farmerEmail)
                .orElseThrow(() -> new RuntimeException("Farmer not found"));
        return feedbackRepository.findByOrder_Product_FarmerIdOrderByCreatedAtDesc(farmer.getId());
    }
}

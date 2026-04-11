package com.farmerretailer.service;

import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import com.farmerretailer.entity.User;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.UUID;

@Service
public class PaymentService {

    @Value("${cashfree.app.id}")
    private String appId;

    @Value("${cashfree.secret.key}")
    private String secretKey;

    @Value("${cashfree.api.url}")
    private String apiUrl;

    private final HttpClient client = HttpClient.newHttpClient();

    @org.springframework.beans.factory.annotation.Autowired
    private com.farmerretailer.repository.OrderRepository orderRepository;

    @org.springframework.beans.factory.annotation.Autowired
    private NotificationService notificationService;

    @org.springframework.beans.factory.annotation.Autowired
    private com.farmerretailer.repository.TransportRepository transportRepository;

    @org.springframework.beans.factory.annotation.Autowired
    private EmailService emailService;

    @org.springframework.beans.factory.annotation.Autowired
    private com.farmerretailer.repository.UserRepository userRepository;

    public java.util.Map<String, String> createOrder(Double amount, String customerId, String customerPhone,
            String customerName, String existingOrderId)
            throws IOException, InterruptedException {
        // Use the existing DB Order ID if provided, otherwise fallback (shouldn't
        // happen in correct flow)
        String orderId = existingOrderId != null ? existingOrderId
                : "ORD_" + UUID.randomUUID().toString().substring(0, 8);

        JSONObject customerDetails = new JSONObject();
        customerDetails.put("customer_id", customerId != null ? customerId : "guest");
        customerDetails.put("customer_phone", customerPhone != null ? customerPhone : "9999999999");
        customerDetails.put("customer_name", customerName != null ? customerName : "Guest");

        JSONObject jsonBody = new JSONObject();
        jsonBody.put("order_id", orderId);
        jsonBody.put("order_amount", amount);
        jsonBody.put("order_currency", "INR");
        jsonBody.put("customer_details", customerDetails);

        jsonBody.put("order_meta",
                // Correct Route is /retailer/dashboard, not /dashboard
                new JSONObject().put("return_url",
                        "http://localhost:5173/retailer/dashboard?tab=Orders&order_id=" + orderId));

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(apiUrl + "/orders"))
                .header("Content-Type", "application/json")
                .header("x-client-id", appId)
                .header("x-client-secret", secretKey)
                .header("x-api-version", "2023-08-01")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody.toString()))
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() == 409) {
            // Order already exists, fetch it to get the payment_session_id
            HttpRequest getOrderRequest = HttpRequest.newBuilder()
                    .uri(URI.create(apiUrl + "/orders/" + orderId))
                    .header("x-client-id", appId)
                    .header("x-client-secret", secretKey)
                    .header("x-api-version", "2023-08-01")
                    .GET()
                    .build();
            HttpResponse<String> getOrderResponse = client.send(getOrderRequest, HttpResponse.BodyHandlers.ofString());

            if (getOrderResponse.statusCode() == 200) {
                String getResStr = getOrderResponse.body();
                JSONObject getResJson = new JSONObject(getResStr);
                String sessionId = getResJson.getString("payment_session_id");
                return java.util.Map.of("payment_session_id", sessionId, "order_id", orderId);
            } else {
                throw new IOException("Failed to fetch existing order: " + getOrderResponse.statusCode());
            }
        }

        if (response.statusCode() >= 400) {
            throw new IOException("Cashfree API Error: " + response.statusCode() + " Body: " + response.body());
        }

        String resStr = response.body();
        JSONObject resJson = new JSONObject(resStr);
        String sessionId = resJson.getString("payment_session_id");
        return java.util.Map.of("payment_session_id", sessionId, "order_id", orderId);
    }

    public synchronized boolean verifyPayment(String orderId) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(apiUrl + "/orders/" + orderId + "/payments"))
                    .header("x-client-id", appId)
                    .header("x-client-secret", secretKey)
                    .header("x-api-version", "2023-08-01")
                    .GET()
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                return false;
            }

            String resStr = response.body();
            JSONArray payments = new JSONArray(resStr);
            boolean isSuccess = false;
            for (int i = 0; i < payments.length(); i++) {
                JSONObject payment = payments.getJSONObject(i);
                if ("SUCCESS".equals(payment.getString("payment_status"))) {
                    isSuccess = true;
                    break;
                }
            }

            if (isSuccess) {
                // Update DB Order Status
                try {
                    String[] parts = orderId.split("_");
                    Long dbId = Long.parseLong(parts[0]);
                    String paymentType = parts.length > 1 ? parts[1] : "PRODUCT";

                    if ("PRODUCT".equalsIgnoreCase(paymentType)) {
                        java.util.Optional<com.farmerretailer.entity.Order> orderOpt = orderRepository.findById(dbId);
                        if (orderOpt.isPresent()) {
                            com.farmerretailer.entity.Order order = orderOpt.get();
                            order.setPaid(true);
                            if (!"CONFIRMED".equals(order.getStatus()) && !"DELIVERED".equals(order.getStatus())) {
                                order.setStatus("CONFIRMED");
                            }
                            orderRepository.save(order);

                            notificationService.createNotification(
                                    order.getRetailer(),
                                    "Product Payment Successful",
                                    "Payment for order #" + order.getId() + " products received.",
                                    "success");

                            if (order.getProduct().getFarmer() != null) {
                                User farmer = order.getProduct().getFarmer();
                                farmer.setEscrowBalance(farmer.getEscrowBalance() + order.getTotalPrice());
                                userRepository.save(farmer);
                                emailService.sendPaymentSuccessFarmer(farmer.getEmail(), order);
                            }
                        }
                    } else if ("LOGISTICS".equalsIgnoreCase(paymentType)) {
                        java.util.Optional<com.farmerretailer.entity.Transport> transportOpt = transportRepository.findByOrderId(dbId);
                        if (transportOpt.isPresent()) {
                            com.farmerretailer.entity.Transport transport = transportOpt.get();
                            transport.setPaid(true);
                            transportRepository.save(transport);

                            notificationService.createNotification(
                                    transport.getOrder().getRetailer(),
                                    "Logistics Payment Successful",
                                    "Transport charges for order #" + dbId + " received.",
                                    "success");
                           
                            if (transport.getDriver() != null && transport.getDriver().getUser() != null) {
                                User driverUser = transport.getDriver().getUser();
                                driverUser.setEscrowBalance(driverUser.getEscrowBalance() + transport.getUpdatedPrice());
                                userRepository.save(driverUser);

                                notificationService.createNotification(
                                    driverUser,
                                    "Payment Received",
                                    "Retailer has paid for delivery of Order #" + dbId + ". Funds added to escrow.",
                                    "info"
                                );
                            }
                        }
                    }
                } catch (Exception e) {
                    System.out.println("Error updating DB after payment: " + e.getMessage());
                }
            }

            return isSuccess;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }
}

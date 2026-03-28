package com.farmerretailer.service;

import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

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
    private EmailService emailService;

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
                    // Try to find order by ID (assuming ID string matches DB)
                    // If ID format implies Long, parse it. But our ID is String in Entity?
                    // Let's assume orderId is String or we parse it.
                    // Actually, Order ID is Long in Entity typically.
                    // But we used "ORD_..." previously.
                    // If we pass DB ID (e.g. "101"), cashfree allows alphanum.
                    // So we should just use the ID as string.
                    Long dbId = Long.parseLong(orderId);
                    java.util.Optional<com.farmerretailer.entity.Order> orderOpt = orderRepository.findById(dbId);
                    if (orderOpt.isPresent()) {
                        com.farmerretailer.entity.Order order = orderOpt.get();
                        // Only update if not already CONFIRMED/DELIVERED/PAID
                        // Let's set to "CONFIRMED" or "PAID"
                        if (!"CONFIRMED".equals(order.getStatus()) && !"DELIVERED".equals(order.getStatus())) {
                            order.setStatus("CONFIRMED"); // Or PAID
                            orderRepository.save(order);

                            notificationService.createNotification(
                                    order.getRetailer(),
                                    "Payment Successful",
                                    "Payment for order #" + order.getId() + " received. Status updated to CONFIRMED.",
                                    "success");

                            // 1) Farmer should get email notification
                            if (order.getProduct().getFarmer() != null) {
                                emailService.sendPaymentSuccessFarmer(order.getProduct().getFarmer().getEmail(), order);
                            }

                            // 2) Both farmer and retailer should get invoice mail
                            if (order.getRetailer() != null) {
                                emailService.sendInvoiceNotification(order.getRetailer().getEmail(), order, false);
                            }
                            if (order.getProduct().getFarmer() != null) {
                                emailService.sendInvoiceNotification(order.getProduct().getFarmer().getEmail(), order,
                                        true);
                            }
                        }
                    }
                } catch (NumberFormatException e) {
                    // ID wasn't a number, maybe it was a test ID... ignore
                    System.out.println("Order ID not numeric, skipping DB update: " + orderId);
                }
            }

            return isSuccess;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }
}

package com.farmerretailer.service;

import com.farmerretailer.entity.Order;
import com.farmerretailer.entity.User;
import com.farmerretailer.entity.Product;
import com.farmerretailer.repository.OrderRepository;
import com.farmerretailer.repository.ProductRepository;
import com.farmerretailer.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class OrderService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private NotificationService notificationService;

    @Transactional
    public Order placeOrder(Long productId, String retailerEmail, Double quantity) {
        User retailer = userRepository.findByEmail(retailerEmail)
                .orElseThrow(() -> new RuntimeException("Retailer not found"));

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        if (product.getQuantity() < quantity) {
            throw new RuntimeException("Insufficient quantity available");
        }

        // Deduct quantity
        product.setQuantity(product.getQuantity() - quantity);
        productRepository.save(product);

        Double totalPrice = product.getPrice() * quantity; // Assuming price is per unit

        Order order = new Order(product, retailer, quantity, totalPrice, "PENDING");
        Order savedOrder = orderRepository.save(order);

        // Notify Farmer
        User farmer = product.getFarmer();
        if (farmer != null) {
            // Email
            emailService.sendOrderPlacedNotification(farmer.getEmail(), product.getName(), quantity,
                    retailer.getFullName());
            // Dashboard Notification with details
            String remaining = product.getQuantity() > 0
                    ? String.format("%.1f %s", product.getQuantity(), product.getUnit())
                    : "Out of Stock";
            notificationService.createNotification(
                    farmer,
                    "New Order Received",
                    String.format("New order from %s: %.1f %s purchased. Remaining Stock: %s.",
                            retailer.getFullName(), quantity, product.getUnit(), remaining),
                    "order");
        }

        // Notify Retailer (Confirmation)
        notificationService.createNotification(
                retailer,
                "Order Placed Successfully",
                "Your order for " + product.getName() + " has been placed. Order ID: " + savedOrder.getId(),
                "success");

        return savedOrder;
    }

    @Transactional(readOnly = true)
    public List<Order> getRetailerOrders(String email) {
        User retailer = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Retailer not found for email: " + email));
        return orderRepository.findAllByRetailerIdWithDetails(retailer.getId());
    }

    @Transactional(readOnly = true)
    public List<Order> getFarmerOrders(String email) {
        System.out.println("OrderService: getFarmerOrders for email: " + email);
        User farmer = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Farmer not found for email: " + email));
        System.out.println("OrderService: Farmer found with ID: " + farmer.getId());
        List<Order> orders = orderRepository.findAllByFarmerIdWithDetails(farmer.getId());
        System.out.println("OrderService: Repository returned " + (orders != null ? orders.size() : 0) + " orders");
        return orders;
    }

    @Transactional
    public Order modifyOrder(Long orderId, Double newQuantity, String retailerEmail) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (!order.getRetailer().getEmail().equals(retailerEmail)) {
            throw new RuntimeException("Unauthorized");
        }

        Product product = order.getProduct();

        // Calculate stock adjustment
        Double oldQuantity = order.getQuantity();
        Double quantityDifference = newQuantity - oldQuantity;

        // Check if we need more stock and if it's available
        if (quantityDifference > 0 && product.getQuantity() < quantityDifference) {
            throw new RuntimeException("Insufficient product quantity for increase");
        }

        // Apply adjustment (deduct difference if positive, add back if negative)
        product.setQuantity(product.getQuantity() - quantityDifference);
        productRepository.save(product);

        order.setQuantity(newQuantity);
        order.setTotalPrice(product.getPrice() * newQuantity);
        Order savedOrder = orderRepository.save(order);

        // Notify Farmer
        User farmer = product.getFarmer();
        if (farmer != null) {
            emailService.sendOrderModifiedNotification(farmer.getEmail(), product.getName(), newQuantity,
                    order.getRetailer().getFullName());

            notificationService.createNotification(
                    farmer,
                    "Order Modified",
                    "Order #" + orderId + " was modified by " + order.getRetailer().getFullName() + ". New Qty: "
                            + newQuantity,
                    "info");
        }

        return savedOrder;
    }

    @Transactional
    public Order updateOrderStatus(Long orderId, String newStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        order.setStatus(newStatus);

        if ("Delivered".equalsIgnoreCase(newStatus)) {
            order.setDeliveredAt(java.time.LocalDateTime.now());
        } else {
            if (!"Delivered".equalsIgnoreCase(newStatus) && order.getDeliveredAt() != null) {
                order.setDeliveredAt(null);
            }
        }

        Order savedOrder = orderRepository.save(order);

        // Notify Retailer about status change (if not already confirmed by them)
        if (!"RECEIVED".equalsIgnoreCase(newStatus)) {
            notificationService.createNotification(
                    order.getRetailer(),
                    "Order Status Updated",
                    "Your order #" + orderId + " is now " + newStatus + ".",
                    "info");
        }

        return savedOrder;
    }

    @Transactional
    public Order confirmOrderReceipt(Long orderId, String retailerEmail) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (!order.getRetailer().getEmail().equals(retailerEmail)) {
            throw new RuntimeException("Unauthorized: Only the assigned retailer can confirm receipt.");
        }

        if (!"DELIVERED".equalsIgnoreCase(order.getStatus())) {
            throw new RuntimeException("Cannot confirm receipt: Order has not been delivered by the transporter yet.");
        }

        order.setStatus("RECEIVED");
        Order savedOrder = orderRepository.save(order);

        // Financial Settlement: Handshake complete, release funds from escrow to available balance
        try {
            // RELEASE FARMER FUNDS
            if (order.getProduct() != null && order.getProduct().getFarmer() != null) {
                User farmer = order.getProduct().getFarmer();
                double amount = order.getTotalPrice();
                if (farmer.getEscrowBalance() >= amount) {
                    farmer.setEscrowBalance(farmer.getEscrowBalance() - amount);
                    farmer.setAvailableBalance(farmer.getAvailableBalance() + amount);
                    userRepository.save(farmer);
                }
            }

            // RELEASE TRANSPORTER FUNDS
            if (order.getTransport() != null && order.getTransport().getDriver() != null) {
                User driverUser = order.getTransport().getDriver().getUser();
                double transportAmount = order.getTransport().getUpdatedPrice();
                if (driverUser != null && driverUser.getEscrowBalance() >= transportAmount) {
                    driverUser.setEscrowBalance(driverUser.getEscrowBalance() - transportAmount);
                    driverUser.setAvailableBalance(driverUser.getAvailableBalance() + transportAmount);
                    userRepository.save(driverUser);
                }
            }
        } catch (Exception e) {
            System.err.println("Settlement Error for Order #" + orderId + ": " + e.getMessage());
        }

        // Notify Farmer
        if (order.getProduct() != null && order.getProduct().getFarmer() != null) {
            notificationService.createNotification(
                    order.getProduct().getFarmer(),
                    "📦 Delivery Confirmed by Retailer",
                    "Retailer " + order.getRetailer().getFullName() + " has confirmed receipt of Order #" + orderId + ". Funds can now be settled.",
                    "success");
        }

        // Notify Transporter
        if (order.getTransport() != null && order.getTransport().getDriver() != null) {
            notificationService.createNotification(
                order.getTransport().getDriver().getUser(),
                "Delivery Confirmed & Verified",
                "Retailer confirmed receipt of Order #" + order.getId() + ". Funds released to your wallet.",
                "success"
            );
        }

        return savedOrder;
    }

    @Transactional
    public void createAuctionOrder(Product product, User retailer, Double winningBidAmount) {
        if (retailer == null || product == null)
            return;

        Double quantity = product.getQuantity();
        if (quantity <= 0)
            return;

        Double totalPrice = winningBidAmount * quantity; // Assuming bid is per unit

        // Create Order
        Order order = new Order(product, retailer, quantity, totalPrice, "PENDING");
        orderRepository.save(order);

        // Update Product
        product.setQuantity(0.0);
        product.setAvailable(false);
        productRepository.save(product);

        // Notify Confirmation to Retailer (Winner)
        emailService.sendAuctionWonNotification(retailer.getEmail(), product.getName(), winningBidAmount, quantity,
                totalPrice);

        notificationService.createNotification(
                retailer,
                "Auction Won!",
                "Congratulations! You won the auction for " + product.getName() + ". Order #" + order.getId()
                        + " created.",
                "success");

        // Notify Farmer (Order Placed)
        if (product.getFarmer() != null) {
            emailService.sendOrderPlacedNotification(
                    product.getFarmer().getEmail(),
                    product.getName(),
                    quantity,
                    retailer.getFullName() + " (Auction Winner)");

            notificationService.createNotification(
                    product.getFarmer(),
                    "Auction Sold - Order Placed",
                    "Your product " + product.getName() + " was sold via auction to " + retailer.getFullName() + ".",
                    "order");
        }
    }

    public void generateInvoicePDF(Long orderId, java.io.OutputStream outputStream) throws Exception {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        com.lowagie.text.Document document = new com.lowagie.text.Document();
        com.lowagie.text.pdf.PdfWriter.getInstance(document, outputStream);

        document.open();

        // Font settings
        com.lowagie.text.Font titleFont = com.lowagie.text.FontFactory
                .getFont(com.lowagie.text.FontFactory.HELVETICA_BOLD, 24, java.awt.Color.GREEN);
        com.lowagie.text.Font headerFont = com.lowagie.text.FontFactory
                .getFont(com.lowagie.text.FontFactory.HELVETICA_BOLD, 14, java.awt.Color.BLACK);
        com.lowagie.text.Font normalFont = com.lowagie.text.FontFactory.getFont(com.lowagie.text.FontFactory.HELVETICA,
                12, java.awt.Color.BLACK);

        // Title
        com.lowagie.text.Paragraph title = new com.lowagie.text.Paragraph("INVOICE - FarmTrade", titleFont);
        title.setAlignment(com.lowagie.text.Element.ALIGN_CENTER);
        document.add(title);
        document.add(new com.lowagie.text.Paragraph(" ")); // Spacer

        // Order Details
        document.add(new com.lowagie.text.Paragraph("Order ID: #" + order.getId(), headerFont));
        document.add(new com.lowagie.text.Paragraph("Date: " + java.time.LocalDateTime.now()
                .format(java.time.format.DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm")), normalFont));
        document.add(new com.lowagie.text.Paragraph("Status: " + order.getStatus(), normalFont));
        document.add(new com.lowagie.text.Paragraph(" ")); // Spacer

        // Table
        com.lowagie.text.pdf.PdfPTable table = new com.lowagie.text.pdf.PdfPTable(4);
        table.setWidthPercentage(100);
        table.addCell("Product");
        table.addCell("Quantity");
        table.addCell("Unit Price");
        table.addCell("Total Price");

        table.addCell(order.getProduct().getName());
        table.addCell(String.format("%.2f %s", order.getQuantity(), order.getProduct().getUnit()));
        table.addCell("₹" + order.getProduct().getPrice());
        table.addCell("₹" + order.getTotalPrice());

        document.add(table);
        document.add(new com.lowagie.text.Paragraph(" ")); // Spacer

        // Footer Details
        document.add(
                new com.lowagie.text.Paragraph("Farmer: " + order.getProduct().getFarmer().getFullName(), normalFont));
        document.add(new com.lowagie.text.Paragraph("Retailer: " + order.getRetailer().getFullName(), normalFont));
        document.add(new com.lowagie.text.Paragraph(" ")); // Spacer

        com.lowagie.text.Paragraph footer = new com.lowagie.text.Paragraph("Thank you for using FarmTrade!",
                normalFont);
        footer.setAlignment(com.lowagie.text.Element.ALIGN_CENTER);
        document.add(footer);

        document.close();
    }
}

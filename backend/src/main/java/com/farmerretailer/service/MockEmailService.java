package com.farmerretailer.service;

import org.springframework.stereotype.Service;

@Service
public class MockEmailService implements EmailService {

    @Override
    public void sendApprovalEmail(String to, String tempPassword) {
        System.out.println("==================================================");
        System.out.println("MOCK EMAIL SERVICE - SENDING EMAIL TO: " + to);
        System.out.println("Subject: Your FarmTrade Account Approved");
        System.out.println("Body:");
        System.out.println("Hello,");
        System.out.println("Your account has been approved by the Admin.");
        System.out.println("You can now login with your registered password.");
        System.out.println("==================================================");
    }

    @Override
    public void sendNewProductNotification(String to, String productName, String farmerName, String productLink) {
        System.out.println("==================================================");
        System.out.println("MOCK EMAIL SERVICE - NEW PRODUCT NOTIFICATION TO: " + to);
        System.out.println("Subject: New Product Listed: " + productName);
        System.out.println("Body: A new product " + productName + " listed by " + farmerName);
        System.out.println("==================================================");
    }

    @Override
    public void sendOrderPlacedNotification(String to, String productName, Double quantity, String retailerName) {
        System.out.println("==================================================");
        System.out.println("MOCK EMAIL SERVICE - ORDER PLACED TO: " + to);
        System.out.println("Subject: New Order: " + productName);
        System.out.println("Body: " + retailerName + " ordered " + quantity + " of " + productName);
        System.out.println("==================================================");
    }

    @Override
    public void sendOrderModifiedNotification(String to, String productName, Double newQuantity, String retailerName) {
        System.out.println("==================================================");
        System.out.println("MOCK EMAIL SERVICE - ORDER MODIFIED TO: " + to);
        System.out.println("Subject: Order Modified: " + productName);
        System.out.println("Body: Order for " + productName + " modified to " + newQuantity + " by " + retailerName);
        System.out.println("==================================================");
    }

    @Override
    public void sendBidPlacedNotification(String to, String productName, Double bidAmount, String retailerName) {
        System.out.println("==================================================");
        System.out.println("MOCK EMAIL SERVICE - BID PLACED TO: " + to);
        System.out.println("Subject: New Bid: " + productName);
        System.out.println("Body: " + retailerName + " placed a bid of " + bidAmount + " on " + productName);
        System.out.println("==================================================");
    }

    @Override
    public void sendAuctionEndedNotification(String to, String productName, Double highestBid, String winnerName) {
        System.out.println("==================================================");
        System.out.println("MOCK EMAIL SERVICE - AUCTION ENDED TO: " + to);
        System.out.println("Subject: Auction Ended: " + productName);
        System.out.println(
                "Body: Auction for " + productName + " ended. Winner: " + winnerName + ", Amount: " + highestBid);
        System.out.println("==================================================");
    }

    @Override
    public void sendAuctionWonNotification(String to, String productName, Double amount, Double quantity,
            Double totalPrice) {
        System.out.println("==================================================");
        System.out.println("MOCK EMAIL SERVICE - AUCTION WON TO: " + to);
        System.out.println("Subject: You Won! Auction for " + productName);
        System.out.println("Body: Congratulations! You won " + productName + ". Qty: " + quantity + ", Price: " + amount
                + ", Total: " + totalPrice);
        System.out.println("==================================================");
    }

    @Override
    public void sendProductSoldNotification(String toEmail, String productName, String winnerName, Double price,
            String farmerName) {
        System.out.println("==================================================");
        System.out.println("MOCK EMAIL SERVICE - PRODUCT SOLD NOTIFICATION TO: " + toEmail);
        System.out.println("Subject: Update on your bid for: " + productName);
        System.out.println("Body: Product " + productName + " sold to " + winnerName + " for " + price);
        System.out.println("==================================================");
    }

    @Override
    public void sendPaymentSuccessFarmer(String to, com.farmerretailer.entity.Order order) {
        System.out.println("==================================================");
        System.out.println("MOCK EMAIL SERVICE - PAYMENT SUCCESS NOTIFICATION TO FARMER: " + to);
        System.out.println("Subject: Payment Received for Order #" + order.getId());
        System.out.println("Body: You have received a payment of ₹" + order.getTotalPrice() + " for product "
                + order.getProduct().getName());
        System.out.println("==================================================");
    }

    @Override
    public void sendInvoiceNotification(String to, com.farmerretailer.entity.Order order, boolean isFarmer) {
        System.out.println("==================================================");
        System.out.println("MOCK EMAIL SERVICE - INVOICE NOTIFICATION TO: " + to);
        System.out.println("Subject: Invoice Generated for Order #" + order.getId());
        System.out.println("Body: Your invoice for " + order.getProduct().getName() + " is ready.");
        System.out
                .println("Click here to view/download: http://localhost:8080/api/orders/" + order.getId() + "/invoice");
        System.out.println("==================================================");
    }

    @Override
    public void sendOtpEmail(String toEmail, String otp) {
        System.out.println("==================================================");
        System.out.println("MOCK EMAIL SERVICE - OTP VERIFICATION TO: " + toEmail);
        System.out.println("Subject: Farm2Trade Security OTP");
        System.out.println("Body: Your continuous authentication OTP is: " + otp);
        System.out.println("==================================================");
    }
}

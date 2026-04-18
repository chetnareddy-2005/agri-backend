package com.farmerretailer.service;

public interface EmailService {
    void sendApprovalEmail(String to, String tempPassword);

    void sendNewProductNotification(String to, String productName, String farmerName, String productLink);

    void sendOrderPlacedNotification(String to, String productName, Double quantity, String retailerName);

    void sendOrderModifiedNotification(String to, String productName, Double newQuantity, String retailerName);

    void sendBidPlacedNotification(String to, String productName, Double bidAmount, String retailerName);

    void sendAuctionEndedNotification(String to, String productName, Double highestBid, String winnerName);

    void sendAuctionWonNotification(String to, String productName, Double amount, Double quantity, Double totalPrice);

    void sendProductSoldNotification(String toEmail, String productName, String winnerName, Double price,
            String farmerName);

    void sendPaymentSuccessFarmer(String to, com.farmerretailer.entity.Order order);

    void sendInvoiceNotification(String to, com.farmerretailer.entity.Order order, boolean isFarmer);

    void sendOtp(String to, String otp);
}

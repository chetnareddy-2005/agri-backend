package com.farmerretailer.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Primary;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import org.springframework.scheduling.annotation.Async;

@Service
@Primary
public class SmtpEmailService implements EmailService {

    @Autowired(required = false) // Optional so it doesn't crash if config is missing initially
    private JavaMailSender emailSender;

    @Async
    @Override
    public void sendApprovalEmail(String to, String tempPassword) {
        if (emailSender == null) {
            System.err.println("JavaMailSender is not configured. Skipping email to " + to);
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("noreply@agriconnect.com"); // Replaced by mail.username usually
            message.setTo(to);
            message.setSubject("Your FarmTrade Account is Approved!");

            String text = "Hello,\n\n" +
                    "Good news! Your account has been officially approved by the FarmTrade Admin.\n" +
                    "You are now a verified member of our community.\n\n" +
                    "Please login here to set your secure password: http://localhost:5173/login\n\n" +
                    "Best regards,\nFarmTrade Team";

            message.setText(text);

            emailSender.send(message);
            System.out.println("Email sent successfully to " + to);
        } catch (Exception e) {
            System.err.println("Failed to send email to " + to + ": " + e.getMessage());
            e.printStackTrace();
        }
    }

    @Async
    @Override
    public void sendNewProductNotification(String to, String productName, String farmerName, String productLink) {
        if (emailSender == null) {
            System.err.println("JavaMailSender is not configured. Skipping email to " + to);
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("noreply@agriconnect.com");
            message.setTo(to);
            message.setSubject("New Product Listed: " + productName);
            message.setText("Hello Retailer,\n\n" +
                    "A new product '" + productName + "' has been listed by " + farmerName + ".\n" +
                    "Check it out here: " + productLink + "\n\n" +
                    "Best regards,\nFarmTrade Team");
            emailSender.send(message);
            System.out.println("New Product notification sent to " + to);
        } catch (Exception e) {
            System.err.println("Failed to send new product email to " + to + ": " + e.getMessage());
        }
    }

    @Async
    @Override
    public void sendOrderPlacedNotification(String to, String productName, Double quantity, String retailerName) {
        if (emailSender == null)
            return;
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("noreply@agriconnect.com");
            message.setTo(to);
            message.setSubject("New Order Received: " + productName);
            message.setText("Hello Farmer,\n\n" +
                    "You have received a new order from " + retailerName + ".\n" +
                    "Product: " + productName + "\n" +
                    "Quantity: " + quantity + "\n\n" +
                    "Please login to your dashboard to fulfill this order.\n\n" +
                    "Best regards,\nFarmTrade Team");
            emailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send order placed email to " + to + ": " + e.getMessage());
        }
    }

    @Async
    @Override
    public void sendOrderModifiedNotification(String to, String productName, Double newQuantity, String retailerName) {
        if (emailSender == null)
            return;
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("noreply@agriconnect.com");
            message.setTo(to);
            message.setSubject("Order Modified: " + productName);
            message.setText("Hello Farmer,\n\n" +
                    "An order has been modified by " + retailerName + ".\n" +
                    "Product: " + productName + "\n" +
                    "New Quantity: " + newQuantity + "\n\n" +
                    "Please check your dashboard for details.\n\n" +
                    "Best regards,\nFarmTrade Team");
            emailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send order modified email to " + to + ": " + e.getMessage());
        }
    }

    @Async
    @Override
    public void sendBidPlacedNotification(String to, String productName, Double bidAmount, String retailerName) {
        if (emailSender == null)
            return;
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("noreply@agriconnect.com");
            message.setTo(to);
            message.setSubject("New Highest Bid Alert! - " + productName);
            message.setText("Dear Farmer,\n\n" +
                    "Exciting news! A new bid has been placed on your product: " + productName + ".\n\n" +
                    "Bid Amount: ₹" + bidAmount + "\n" +
                    "Retailer: " + retailerName + "\n\n" +
                    "Login to your dashboard to view or manage your listings.\n\n" +
                    "From,\nFarmTrade Notification System");
            emailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send bid placed email to " + to + ": " + e.getMessage());
        }
    }

    @Async
    @Override
    public void sendAuctionEndedNotification(String to, String productName, Double highestBid, String winnerName) {
        if (emailSender == null)
            return;
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("noreply@agriconnect.com");
            message.setTo(to);
            message.setSubject("Auction Ended - Action Required: " + productName);

            String body;
            if (highestBid != null && highestBid > 0) {
                body = "Dear Farmer,\n\n" +
                        "The auction for your product '" + productName + "' has ended.\n\n" +
                        "Winner: " + winnerName + "\n" +
                        "Winning Bid: ₹" + highestBid + "\n\n" +
                        "Please contact the retailer or proceed with the delivery arrangements.\n\n" +
                        "Best regards,\nFarmTrade Team";
            } else {
                body = "Dear Farmer,\n\n" +
                        "The auction for your product '" + productName + "' has ended.\n\n" +
                        "Unfortunately, no bids were placed during the auction period.\n\n" +
                        "You may choose to relist the product or update the details.\n\n" +
                        "Best regards,\nFarmTrade Team";
            }

            message.setText(body);
            emailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send auction ended email to " + to + ": " + e.getMessage());
        }
    }

    @Async
    @Override
    public void sendAuctionWonNotification(String to, String productName, Double amount, Double quantity,
            Double totalPrice) {
        if (emailSender == null)
            return;
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("noreply@agriconnect.com");
            message.setTo(to);
            message.setSubject("Congratulations! You Saved the Deal: " + productName);

            String body = "Dear Retailer,\n\n" +
                    "Congratulations! You had the highest bid for " + productName + ".\n\n" +
                    "Order Details:\n" +
                    "Product: " + productName + "\n" +
                    "Winning Bid: ₹" + amount + " / unit\n" +
                    "Quantity: " + quantity + "\n" +
                    "Total Price: ₹" + totalPrice + "\n\n" +
                    "An order has been automatically placed for you. Please check your dashboard for payment and delivery details.\n\n"
                    +
                    "Best regards,\nFarmTrade Team";

            message.setText(body);
            emailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send auction won email to " + to + ": " + e.getMessage());
        }
    }

    @Async
    @Override
    public void sendProductSoldNotification(String toEmail, String productName, String winnerName, Double price,
            String farmerName) {
        if (emailSender == null)
            return;
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("noreply@agriconnect.com");
            message.setTo(toEmail);
            message.setSubject("Update on your bid: " + productName);
            message.setText("Hello,\n\n" +
                    "The product '" + productName + "' you bid on has been sold to another retailer (" + winnerName
                    + ") for ₹" + price + ".\n" +
                    "Farmer: " + farmerName + "\n\n" +
                    "Better luck next time!\n\n" +
                    "Best Regards,\nFarmTrade Team");
            emailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send product sold email to " + toEmail + ": " + e.getMessage());
        }
    }

    @Async
    @Override
    public void sendPaymentSuccessFarmer(String to, com.farmerretailer.entity.Order order) {
        if (emailSender == null)
            return;
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("noreply@agriconnect.com");
            message.setTo(to);
            message.setSubject("Payment Received: Order #" + order.getId());
            message.setText("Hello Farmer,\n\n" +
                    "Great news! Payment for order #" + order.getId() + " has been successfully received.\n\n" +
                    "Transaction Details:\n" +
                    "Product: " + order.getProduct().getName() + "\n" +
                    "Amount Received: ₹" + order.getTotalPrice() + "\n" +
                    "Retailer: " + order.getRetailer().getFullName() + "\n\n" +
                    "Please proceed with the fulfillment process if not already done.\n\n" +
                    "Best Regards,\nFarmTrade Finance Team");
            emailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send payment success farmer email to " + to + ": " + e.getMessage());
        }
    }

    @Async
    @Override
    public void sendInvoiceNotification(String to, com.farmerretailer.entity.Order order, boolean isFarmer) {
        if (emailSender == null)
            return;
        try {
            jakarta.mail.internet.MimeMessage mimeMessage = emailSender.createMimeMessage();
            org.springframework.mail.javamail.MimeMessageHelper helper = new org.springframework.mail.javamail.MimeMessageHelper(
                    mimeMessage, "utf-8");

            String role = isFarmer ? "Farmer" : "Retailer";
            String action = isFarmer ? "records" : "payment confirmation";
            String invoiceUrl = "http://localhost:8080/api/orders/" + order.getId() + "/invoice";

            String htmlContent = "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden;'>"
                    +
                    "<div style='background-color: #16a34a; color: white; padding: 20px; text-align: center;'>" +
                    "<h2 style='margin: 0;'>Invoice Generated</h2>" +
                    "</div>" +
                    "<div style='padding: 30px; line-height: 1.6; color: #333;'>" +
                    "<p>Hello <b>" + role + "</b>,</p>" +
                    "<p>The invoice for your recent order <b>#" + order.getId() + "</b> ("
                    + order.getProduct().getName() + ") has been generated.</p>" +
                    "<div style='text-align: center; margin: 30px 0;'>" +
                    "<a href='" + invoiceUrl
                    + "' style='background-color: #16a34a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;'>Download & View Invoice</a>"
                    +
                    "</div>" +
                    "<p style='font-size: 0.9rem; color: #666;'>If the button above doesn't work, copy and paste this link into your browser:<br>"
                    +
                    "<a href='" + invoiceUrl + "' style='color: #16a34a;'>" + invoiceUrl + "</a></p>" +
                    "</div>" +
                    "<div style='background-color: #f8fafc; color: #94a3b8; padding: 15px; text-align: center; font-size: 0.8rem; border-top: 1px solid #e0e0e0;'>"
                    +
                    "&copy; 2025 FarmTrade Platform. All rights reserved." +
                    "</div>" +
                    "</div>";

            helper.setTo(to);
            helper.setSubject("Invoice Generated: Order #" + order.getId());
            helper.setText(htmlContent, true);
            helper.setFrom("noreply@agriconnect.com");

            emailSender.send(mimeMessage);
            System.out.println("HTML Invoice notification sent to " + to);
        } catch (Exception e) {
            System.err.println("Failed to send HTML invoice notification to " + to + ": " + e.getMessage());
        }
    }

    @Override
    public void sendOtpEmail(String toEmail, String otp) {
        if (emailSender == null) {
            System.err.println("JavaMailSender not configured. Skipping OTP to " + toEmail);
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("noreply@farm2trade.com");
            message.setTo(toEmail);
            message.setSubject("Farm2Trade Security: Your OTP");
            message.setText("Hello,\n\n" +
                    "We detected some unusual activity on your account.\n" +
                    "Please use the following OTP to verify your identity: " + otp + "\n\n" +
                    "This code will expire in 5 minutes.\n\n" +
                    "Best regards,\nFarmTrade Security Team");
            
            System.out.println("📬 [DEBUG] Sending OTP to " + toEmail + "...");
            emailSender.send(message);
            System.out.println("✅ [DEBUG] OTP sent successfully!");
        } catch (Exception e) {
            System.err.println("❌ [ERROR] Failed to send OTP to " + toEmail + ": " + e.getMessage());
        }
    }
}

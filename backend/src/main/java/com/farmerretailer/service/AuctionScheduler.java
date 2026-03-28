package com.farmerretailer.service;

import com.farmerretailer.entity.Bid;
import com.farmerretailer.entity.Product;
import com.farmerretailer.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class AuctionScheduler {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private BidService bidService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private OrderService orderService;

    @Autowired
    private NotificationService notificationService;

    @Scheduled(fixedRate = 60000) // Run every minute
    @Transactional
    public void checkEndedAuctions() {
        LocalDateTime now = LocalDateTime.now();
        List<Product> endedProducts = productRepository
                .findByBiddingEndTimeBeforeAndAuctionEndNotificationSentFalse(now);

        for (Product product : endedProducts) {
            try {
                // Find highest bid and winner
                List<Bid> bids = bidService.getProductBids(product.getId());
                Double highestBidAmount = 0.0;
                String winnerName = "No Bids";
                com.farmerretailer.entity.User winner = null;

                if (bids != null && !bids.isEmpty()) {
                    Bid highestBid = bids.get(0); // Assumes ordered by amount desc
                    highestBidAmount = highestBid.getAmount();
                    winner = highestBid.getRetailer();
                    winnerName = winner.getFullName();

                    // Create Automatic Order
                    orderService.createAuctionOrder(product, winner, highestBidAmount);
                }

                if (product.getFarmer() != null) {
                    emailService.sendAuctionEndedNotification(
                            product.getFarmer().getEmail(),
                            product.getName(),
                            highestBidAmount,
                            winnerName);

                    notificationService.createNotification(
                            product.getFarmer(),
                            "Auction Ended",
                            "The auction for '" + product.getName() + "' has ended. Winner: " + winnerName,
                            "info");
                }

                product.setAuctionEndNotificationSent(true);
                productRepository.save(product);

                System.out.println("Processed auction end for product: " + product.getName());

            } catch (Exception e) {
                System.err
                        .println("Error processing auction end for product " + product.getId() + ": " + e.getMessage());
            }
        }
    }
}

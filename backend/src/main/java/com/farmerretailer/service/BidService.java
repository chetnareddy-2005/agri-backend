package com.farmerretailer.service;

import com.farmerretailer.entity.Bid;
import com.farmerretailer.entity.Product;
import com.farmerretailer.entity.User;
import com.farmerretailer.repository.BidRepository;
import com.farmerretailer.repository.ProductRepository;
import com.farmerretailer.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class BidService {

    @Autowired
    private BidRepository bidRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private com.farmerretailer.service.OrderService orderService;

    @Transactional
    public Bid placeBid(Long productId, Double amount, String retailerEmail) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        User retailer = userRepository.findByEmail(retailerEmail)
                .orElseThrow(() -> new RuntimeException("Retailer not found"));

        // Check if bid is higher than current max
        Double currentMax = bidRepository.findHighestBidAmountByProductId(productId);
        if (currentMax == null)
            currentMax = product.getPrice(); // Or base price

        if (amount <= currentMax) {
            throw new RuntimeException("Bid must be higher than current highest bid: " + currentMax);
        }

        Bid bid = new Bid();
        bid.setProduct(product);
        bid.setRetailer(retailer);
        bid.setAmount(amount);

        Bid savedBid = bidRepository.save(bid);

        return savedBid;
    }

    public List<Bid> getMyBids(String retailerEmail) {
        User retailer = userRepository.findByEmail(retailerEmail)
                .orElseThrow(() -> new RuntimeException("Retailer not found"));
        return bidRepository.findByRetailerId(retailer.getId());
    }

    public Double getHighestBid(Long productId) {
        return bidRepository.findHighestBidAmountByProductId(productId);
    }

    public List<Bid> getProductBids(Long productId) {
        return bidRepository.findByProductIdOrderByAmountDesc(productId);
    }

    @Transactional
    public void acceptBid(Long bidId) {
        Bid bid = bidRepository.findById(bidId)
                .orElseThrow(() -> new RuntimeException("Bid not found"));

        Product product = bid.getProduct();
        User winner = bid.getRetailer();
        Double winningPrice = bid.getAmount();

        // 1. Create Auction Order (Sales Logic)
        // This triggers "Auction Won" notification to Winner and "Order Placed" logic
        // to Farmer
        orderService.createAuctionOrder(product, winner, winningPrice);

        // 2. Notify Other Bidders
        List<User> otherBidders = bidRepository.findDistinctRetailerByProductIdAndRetailerIdNot(product.getId(),
                winner.getId());

        for (User loser : otherBidders) {
            emailService.sendProductSoldNotification(loser.getEmail(), product.getName(), winner.getFullName(),
                    winningPrice, product.getFarmer().getFullName());

            notificationService.createNotification(
                    loser,
                    "Bid Update: Product Sold",
                    "The product " + product.getName() + " has been sold to another retailer for ₹" + winningPrice
                            + ".",
                    "info");
        }
    }
}

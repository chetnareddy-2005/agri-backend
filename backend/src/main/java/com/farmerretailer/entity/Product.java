package com.farmerretailer.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "products")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String category; // e.g., Vegetables, Fruits, Grains

    @Column(length = 1000)
    private String description;

    @Column(nullable = false)
    private Double quantity;

    @Column(nullable = false)
    private String unit; // e.g., kg, tons, units

    @Column(nullable = false)
    private Double price; // Base price or starting bid

    private boolean available = true;

    @Transient
    private Double highestBid;

    public Double getHighestBid() {
        return highestBid;
    }

    public void setHighestBid(Double highestBid) {
        this.highestBid = highestBid;
    }

    @ElementCollection
    @Column(columnDefinition = "LONGTEXT")
    private java.util.List<String> imageUrls; // Stores Base64 strings or URLs

    private String deliveryEstimate; // e.g., "2-3 days"

    private String location; // Farm location

    private LocalDateTime biddingStartTime; // Start of the auction
    private LocalDateTime biddingEndTime; // End of the auction

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farmer_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private User farmer;

    private String listingType; // AUCTION, DIRECT

    public String getListingType() {
        return listingType;
    }

    public void setListingType(String listingType) {
        this.listingType = listingType;
    }

    @OneToMany(mappedBy = "product", fetch = FetchType.LAZY)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private java.util.List<Order> orders;

    @Transient
    private String winnerName;

    public String getWinnerName() {
        return winnerName;
    }

    public void setWinnerName(String winnerName) {
        this.winnerName = winnerName;
    }

    @Transient
    private java.util.List<BuyerInfo> buyers;

    public java.util.List<BuyerInfo> getBuyers() {
        return buyers;
    }

    public void setBuyers(java.util.List<BuyerInfo> buyers) {
        this.buyers = buyers;
    }

    public static class BuyerInfo {
        private String retailerName;
        private Double quantity;

        public BuyerInfo() {
        }

        public BuyerInfo(String retailerName, Double quantity) {
            this.retailerName = retailerName;
            this.quantity = quantity;
        }

        public String getRetailerName() {
            return retailerName;
        }

        public void setRetailerName(String retailerName) {
            this.retailerName = retailerName;
        }

        public Double getQuantity() {
            return quantity;
        }

        public void setQuantity(Double quantity) {
            this.quantity = quantity;
        }
    }

    public java.util.List<Order> getOrders() {
        return orders;
    }

    public void setOrders(java.util.List<Order> orders) {
        this.orders = orders;
    }

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Constructors
    public Product() {
    }

    public Product(String name, String category, Double quantity, String unit, Double price, User farmer) {
        this.name = name;
        this.category = category;
        this.quantity = quantity;
        this.unit = unit;
        this.price = price;
        this.farmer = farmer;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Double getQuantity() {
        return quantity;
    }

    public void setQuantity(Double quantity) {
        this.quantity = quantity;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public Double getPrice() {
        return price;
    }

    public void setPrice(Double price) {
        this.price = price;
    }

    public boolean isAvailable() {
        return available;
    }

    public void setAvailable(boolean available) {
        this.available = available;
    }

    public java.util.List<String> getImageUrls() {
        return imageUrls;
    }

    public void setImageUrls(java.util.List<String> imageUrls) {
        this.imageUrls = imageUrls;
    }

    public String getDeliveryEstimate() {
        return deliveryEstimate;
    }

    public void setDeliveryEstimate(String deliveryEstimate) {
        this.deliveryEstimate = deliveryEstimate;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public LocalDateTime getBiddingStartTime() {
        return biddingStartTime;
    }

    public void setBiddingStartTime(LocalDateTime biddingStartTime) {
        this.biddingStartTime = biddingStartTime;
    }

    public LocalDateTime getBiddingEndTime() {
        return biddingEndTime;
    }

    public void setBiddingEndTime(LocalDateTime biddingEndTime) {
        this.biddingEndTime = biddingEndTime;
    }

    public User getFarmer() {
        return farmer;
    }

    public void setFarmer(User farmer) {
        this.farmer = farmer;
    }

    private boolean auctionEndNotificationSent = false;

    public boolean isAuctionEndNotificationSent() {
        return auctionEndNotificationSent;
    }

    public void setAuctionEndNotificationSent(boolean auctionEndNotificationSent) {
        this.auctionEndNotificationSent = auctionEndNotificationSent;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}

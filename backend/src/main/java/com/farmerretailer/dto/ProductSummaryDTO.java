package com.farmerretailer.dto;

import java.time.LocalDateTime;

public class ProductSummaryDTO {
    private Long id;
    private String name;
    private String category;
    private String description;
    private Double quantity;
    private String unit;
    private Double price;
    private String deliveryEstimate;
    private String location;
    private LocalDateTime biddingStartTime;
    private LocalDateTime biddingEndTime;
    private String farmerName;
    private String winnerName;
    private boolean available;
    private String listingType;

    public ProductSummaryDTO(Long id, String name, String category, String description, Double quantity, String unit,
            Double price, String deliveryEstimate, String location, LocalDateTime biddingStartTime,
            LocalDateTime biddingEndTime, String farmerName, String winnerName, boolean available, String listingType) {
        this.id = id;
        this.name = name;
        this.category = category;
        this.description = description;
        this.quantity = quantity;
        this.unit = unit;
        this.price = price;
        this.deliveryEstimate = deliveryEstimate;
        this.location = location;
        this.biddingStartTime = biddingStartTime;
        this.biddingEndTime = biddingEndTime;
        this.farmerName = farmerName;
        this.winnerName = winnerName;
        this.available = available;
        this.listingType = listingType;
    }

    // Getters
    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getCategory() {
        return category;
    }

    public String getDescription() {
        return description;
    }

    public Double getQuantity() {
        return quantity;
    }

    public String getUnit() {
        return unit;
    }

    public Double getPrice() {
        return price;
    }

    public String getDeliveryEstimate() {
        return deliveryEstimate;
    }

    public String getLocation() {
        return location;
    }

    public LocalDateTime getBiddingStartTime() {
        return biddingStartTime;
    }

    public LocalDateTime getBiddingEndTime() {
        return biddingEndTime;
    }

    public String getFarmerName() {
        return farmerName;
    }

    public String getWinnerName() {
        return winnerName;
    }

    public boolean isAvailable() {
        return available;
    }

    public String getListingType() {
        return listingType;
    }
}

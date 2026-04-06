package com.farmerretailer.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "transports")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Transport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "order_id", nullable = false)
    @JsonBackReference
    private Order order;

    @ManyToOne
    @JoinColumn(name = "driver_id", nullable = true)
    private Driver driver;

    private String transportMethod; // OWN, PLATFORM
    private Double distanceKm;
    private Double initialPrice; 
    private Double updatedPrice;
    private String priceChangedBy; // RETAILER, TRANSPORTER
    private boolean isPriceAcceptedByRetailer = false;
    private boolean isPriceAcceptedByTransporter = false;

    // Advanced Pricing
    private Double surgeMultiplier = 1.0;
    private Double weatherMultiplier = 1.0;
    private String priceReason; // "High Demand", "Rainy Weather"

    // Scheduling
    private java.time.LocalDate scheduledDate;
    private String timeSlot; // Morning, Afternoon, Evening

    private String status; // PENDING, SCHEDULED, PRICE_UPDATED, ACCEPTED, ON_THE_WAY, DELIVERED
    private boolean isConfirmedByRetailer = false;
    private String suggestedVehicle;

    // Delivery Proof
    private String deliveryPhotoUrl;
    private String signatureData;
    private boolean isPaid = false; // LOGISTICS PAYMENT

    // Post-delivery Ratings
    private Double retailerToTransporterRating;
    private Double transporterToRetailerRating;
}

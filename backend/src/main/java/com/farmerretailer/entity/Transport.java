package com.farmerretailer.entity;

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
    private Order order;

    @ManyToOne
    @JoinColumn(name = "driver_id", nullable = true)
    private Driver driver;

    private String transportMethod; // OWN, PLATFORM
    private Double distanceKm;
    private Double price; 
    private String status; // PENDING, ACCEPTED, IN_TRANSIT, DELIVERED

    private boolean isConfirmedByRetailer = false;
    
    // To identify suggested vehicle
    private String suggestedVehicle;
}

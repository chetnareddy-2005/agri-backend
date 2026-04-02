package com.farmerretailer.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "drivers")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Driver {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private User user;

    private String vehicleType; // Bike, Auto, Truck
    private String capacity;

    private Double currentLat;
    private Double currentLng;

    private boolean isAvailable = true;
    private Double rating = 4.5;
    
    // Behavior tracking
    private Integer totalRequests = 0;
    private Integer acceptedRequests = 0;
    private Integer cancelledRequests = 0;
    private Integer deliveredRequests = 0;
    
    private String badge; // PRO, SILVER, GOLD, TOP_RATED
    private Integer points = 0; // Gamification
}

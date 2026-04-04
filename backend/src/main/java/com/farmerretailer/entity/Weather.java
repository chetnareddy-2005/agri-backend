package com.farmerretailer.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "weather_data")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Weather {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String location; // City or region
    private Double latitude;
    private Double longitude;
    
    private Double temperature;
    private Double rainProbability;
    @Column(name = "weather_condition")
    private String weatherCondition; // e.g., "Sunny", "Rainy", "Cloudy"
    private Double windSpeed;
    private Double humidity;
    
    private String alerts; // "Heavy Rain Warning", "Heatwave Alert"
    private Boolean isManualOverride = false;
    
    private LocalDateTime lastUpdated;
}

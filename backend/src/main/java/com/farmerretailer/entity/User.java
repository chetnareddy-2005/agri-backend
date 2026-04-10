package com.farmerretailer.entity;

import com.farmerretailer.model.Role;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private String password;

    @Column(nullable = false)
    private String mobileNumber;

    // Additional fields for Farmer/Retailer profile
    private String businessName; // Farm Name or Store Name
    private String address;
    private String city;
    private String state;
    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "ENUM('ADMIN', 'FARMER', 'RETAILER', 'TRANSPORTER')")
    private Role role;

    private boolean isActive = true;
    @Column(name = "is_verified", columnDefinition = "boolean default false")
    private boolean verified = false;

    // For password reset/verification flow
    private boolean mustChangePassword = false;
    private String verificationToken;
    private LocalDateTime tokenExpiryDate;

    private String documentName;

    @Lob
    @Column(length = 10000000) // Increase size limit for BLOB
    @com.fasterxml.jackson.annotation.JsonIgnore
    private byte[] documentContent;

    private String documentContentType;
}

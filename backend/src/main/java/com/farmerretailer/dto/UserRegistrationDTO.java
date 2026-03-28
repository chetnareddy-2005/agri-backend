package com.farmerretailer.dto;

import lombok.Data;

@Data
public class UserRegistrationDTO {
    private String fullName;
    private String email;
    // private String password; // Removed for new flow
    private String mobileNumber;
    private String role;

    // New fields
    private String businessName;
    private String address;
    private String description;
    private String documentName;
}

package com.farmerretailer.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "complaints")
public class Complaint {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(columnDefinition = "TEXT")
    private String message;

    private LocalDateTime timestamp;

    private String status; // "OPEN", "RESOLVED"

    @Column(name = "is_admin_initiated")
    private Boolean isAdminInitiated = false;

    @Column(name = "has_unread_messages_for_admin")
    private Boolean hasUnreadMessagesForAdmin = true;

    public Complaint() {
        this.timestamp = LocalDateTime.now();
        this.status = "OPEN";
        this.hasUnreadMessagesForAdmin = true;
    }

    public Complaint(User user, String message) {
        this.user = user;
        this.message = message;
        this.timestamp = LocalDateTime.now();
        this.status = "OPEN";
        this.hasUnreadMessagesForAdmin = true;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    @OneToMany(mappedBy = "complaint", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @OrderBy("timestamp ASC")
    private java.util.List<ComplaintResponse> responses;

    public java.util.List<ComplaintResponse> getResponses() {
        return responses;
    }

    public void setResponses(java.util.List<ComplaintResponse> responses) {
        this.responses = responses;
    }

    public Boolean getIsAdminInitiated() {
        return isAdminInitiated;
    }

    public void setIsAdminInitiated(Boolean isAdminInitiated) {
        this.isAdminInitiated = isAdminInitiated;
    }

    public Boolean getHasUnreadMessagesForAdmin() {
        return hasUnreadMessagesForAdmin;
    }

    public void setHasUnreadMessagesForAdmin(Boolean hasUnreadMessagesForAdmin) {
        this.hasUnreadMessagesForAdmin = hasUnreadMessagesForAdmin;
    }
}

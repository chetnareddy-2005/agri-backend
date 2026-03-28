package com.farmerretailer.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "orders")
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne
    @JoinColumn(name = "retailer_id", nullable = false)
    private User retailer;

    @Column(nullable = false)
    private Double quantity;

    @Column(nullable = false)
    private Double totalPrice;

    private String status; // PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED

    private LocalDateTime orderDate;

    private LocalDateTime deliveredAt;

    private boolean paymentNotificationSent = false;

    public boolean isPaymentNotificationSent() {
        return paymentNotificationSent;
    }

    public void setPaymentNotificationSent(boolean paymentNotificationSent) {
        this.paymentNotificationSent = paymentNotificationSent;
    }

    @PrePersist
    protected void onCreate() {
        orderDate = LocalDateTime.now();
        if (status == null)
            status = "PENDING";
    }

    // Constructors
    public Order() {
    }

    public Order(Product product, User retailer, Double quantity, Double totalPrice, String status) {
        this.product = product;
        this.retailer = retailer;
        this.quantity = quantity;
        this.totalPrice = totalPrice;
        this.status = status;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Product getProduct() {
        return product;
    }

    public void setProduct(Product product) {
        this.product = product;
    }

    public User getRetailer() {
        return retailer;
    }

    public void setRetailer(User retailer) {
        this.retailer = retailer;
    }

    public Double getQuantity() {
        return quantity;
    }

    public void setQuantity(Double quantity) {
        this.quantity = quantity;
    }

    public Double getTotalPrice() {
        return totalPrice;
    }

    public void setTotalPrice(Double totalPrice) {
        this.totalPrice = totalPrice;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getOrderDate() {
        return orderDate;
    }

    public void setOrderDate(LocalDateTime orderDate) {
        this.orderDate = orderDate;
    }

    public LocalDateTime getDeliveredAt() {
        return deliveredAt;
    }

    public void setDeliveredAt(LocalDateTime deliveredAt) {
        this.deliveredAt = deliveredAt;
    }
}

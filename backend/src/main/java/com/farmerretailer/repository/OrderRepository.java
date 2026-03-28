package com.farmerretailer.repository;

import com.farmerretailer.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import org.springframework.data.repository.query.Param;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    @org.springframework.data.jpa.repository.Query("SELECT o FROM Order o WHERE o.retailer.id = :retailerId AND o.status = 'DELIVERED' AND o.id NOT IN (SELECT f.order.id FROM Feedback f)")
    List<Order> findOrdersPendingFeedback(@Param("retailerId") Long retailerId);

    List<Order> findByProductId(Long productId);

    List<Order> findByRetailerId(Long retailerId);

    List<Order> findByProductFarmerId(Long farmerId);

    long countByRetailerId(Long retailerId);

    long countByRetailerIdAndStatus(Long retailerId, String status);

    List<Order> findByRetailerIdAndStatus(Long retailerId, String status);

    long countByRetailerIdAndStatusIgnoreCase(Long retailerId, String status);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(o) FROM Order o WHERE o.retailer.id = :retailerId AND o.status IN ('PENDING', 'CONFIRMED', 'SHIPPED')")
    long countPendingShipments(@Param("retailerId") Long retailerId);

    long countByProductFarmerId(Long farmerId);

    long countByProductFarmerIdAndStatus(Long farmerId, String status);

    @org.springframework.data.jpa.repository.Query("SELECT SUM(o.totalPrice) FROM Order o WHERE o.product.farmer.id = :farmerId AND LOWER(o.status) = LOWER(:status)")
    Double sumTotalPriceByProductFarmerIdAndStatus(@Param("farmerId") Long farmerId, @Param("status") String status);

    // Dynamic Graphs Queries

    // Group by Month (using function month) - Returns Object[]: [Month(int),
    // Count(long)]
    @org.springframework.data.jpa.repository.Query("SELECT MONTH(o.orderDate), COUNT(o) FROM Order o WHERE o.retailer.id = :retailerId GROUP BY MONTH(o.orderDate) ORDER BY MONTH(o.orderDate)")
    List<Object[]> findOrdersGroupedByMonth(@Param("retailerId") Long retailerId);

    // Group by Status - Returns Object[]: [Status(String), Count(long)]
    @org.springframework.data.jpa.repository.Query("SELECT o.status, COUNT(o) FROM Order o WHERE o.retailer.id = :retailerId GROUP BY o.status")
    List<Object[]> findOrdersGroupedByStatus(@Param("retailerId") Long retailerId);

    // Farmer Monthly Sales - Returns Object[]: [Month(int), TotalSales(double)]
    @org.springframework.data.jpa.repository.Query("SELECT MONTH(o.orderDate), SUM(o.totalPrice) FROM Order o WHERE o.product.farmer.id = :farmerId AND o.status = 'Delivered' GROUP BY MONTH(o.orderDate) ORDER BY MONTH(o.orderDate)")
    List<Object[]> findMonthlySalesByFarmerId(@Param("farmerId") Long farmerId);

    boolean existsByProductId(Long productId);

    List<Order> findByOrderDateBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);

    List<Order> findByPaymentNotificationSentFalseAndOrderDateBefore(java.time.LocalDateTime time);

    void deleteByProductId(Long productId);

    void deleteByRetailerId(Long retailerId);
}

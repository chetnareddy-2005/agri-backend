package com.farmerretailer.repository;

import com.farmerretailer.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import org.springframework.data.repository.query.Param;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    @org.springframework.data.jpa.repository.Query("SELECT o FROM Order o WHERE o.retailer.id = :retailerId AND (LOWER(o.status) = 'delivered' OR LOWER(o.status) = 'received') AND o.id NOT IN (SELECT f.order.id FROM Feedback f)")
    List<Order> findOrdersPendingFeedback(@Param("retailerId") Long retailerId);

    List<Order> findByProductId(Long productId);

    List<Order> findByProductFarmerId(Long farmerId);

    @org.springframework.data.jpa.repository.Query("SELECT o FROM Order o JOIN FETCH o.product p JOIN FETCH p.farmer f LEFT JOIN FETCH o.transport t WHERE o.retailer.id = :retailerId ORDER BY o.orderDate DESC")
    List<Order> findAllByRetailerIdWithDetails(@Param("retailerId") Long retailerId);

    @org.springframework.data.jpa.repository.Query("SELECT o FROM Order o JOIN FETCH o.product p JOIN FETCH p.farmer f LEFT JOIN FETCH o.transport t WHERE f.id = :farmerId ORDER BY o.orderDate DESC")
    List<Order> findAllByFarmerIdWithDetails(@Param("farmerId") Long farmerId);

    List<Order> findByRetailerId(Long retailerId);

    @org.springframework.data.jpa.repository.Query(value = "SELECT COUNT(*) FROM orders WHERE retailer_id = :retailerId", nativeQuery = true)
    long countByRetailerId(@Param("retailerId") Long retailerId);

    long countByRetailerIdAndStatus(Long retailerId, String status);

    List<Order> findByRetailerIdAndStatus(Long retailerId, String status);

    long countByRetailerIdAndStatusIgnoreCase(Long retailerId, String status);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(o) FROM Order o WHERE o.retailer.id = :retailerId AND o.status = 'PENDING'")
    long countPendingByRetailerId(@Param("retailerId") Long retailerId);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(o) FROM Order o WHERE o.retailer.id = :retailerId AND o.status IN ('SHIPPED', 'IN_TRANSIT')")
    long countActiveByRetailerId(@Param("retailerId") Long retailerId);

    long countByProductFarmerId(Long farmerId);

    long countByProductFarmerIdAndStatus(Long farmerId, String status);

    @org.springframework.data.jpa.repository.Query("SELECT SUM(o.totalPrice) FROM Order o WHERE o.product.farmer.id = :farmerId AND (LOWER(o.status) = 'delivered' OR LOWER(o.status) = 'received')")
    Double sumTotalSalesByFarmerId(@Param("farmerId") Long farmerId);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(o) FROM Order o WHERE o.retailer.id = :retailerId AND (LOWER(o.status) = 'delivered' OR LOWER(o.status) = 'received')")
    long countDeliveredByRetailerId(@Param("retailerId") Long retailerId);

    @org.springframework.data.jpa.repository.Query(value = "SELECT AVG(EXTRACT(EPOCH FROM (delivered_at - order_date)) / 86400) FROM orders WHERE retailer_id = :retailerId AND delivered_at IS NOT NULL", nativeQuery = true)
    Double calculateAvgDeliveryDaysByRetailerId(@Param("retailerId") Long retailerId);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(o) FROM Order o WHERE o.product.farmer.id = :farmerId AND o.status = 'PENDING'")
    long countPendingByFarmerId(@Param("farmerId") Long farmerId);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(o) FROM Order o WHERE o.product.farmer.id = :farmerId AND o.status IN ('SHIPPED', 'IN_TRANSIT')")
    long countActiveByFarmerId(@Param("farmerId") Long farmerId);

    // Dynamic Graphs Queries

    // Group by Month (using function month) - Returns Object[]: [Month(int), Count(long)]
    @org.springframework.data.jpa.repository.Query(value = "SELECT EXTRACT(MONTH FROM order_date), COUNT(*) FROM orders WHERE retailer_id = :retailerId GROUP BY EXTRACT(MONTH FROM order_date) ORDER BY EXTRACT(MONTH FROM order_date)", nativeQuery = true)
    List<Object[]> findOrdersGroupedByMonth(@Param("retailerId") Long retailerId);

    // Group by Status - Returns Object[]: [Status(String), Count(long)]
    @org.springframework.data.jpa.repository.Query(value = "SELECT status, COUNT(*) FROM orders WHERE retailer_id = :retailerId GROUP BY status", nativeQuery = true)
    List<Object[]> findOrdersGroupedByStatus(@Param("retailerId") Long retailerId);

    // Farmer Monthly Sales - Returns Object[]: [Month(int), TotalSales(double)]
    @org.springframework.data.jpa.repository.Query("SELECT EXTRACT(MONTH FROM o.orderDate), SUM(o.totalPrice) FROM Order o WHERE o.product.farmer.id = :farmerId AND (LOWER(o.status) = 'delivered' OR LOWER(o.status) = 'received') GROUP BY EXTRACT(MONTH FROM o.orderDate) ORDER BY EXTRACT(MONTH FROM o.orderDate)")
    List<Object[]> findMonthlySalesByFarmerId(@Param("farmerId") Long farmerId);

    boolean existsByProductId(Long productId);

    List<Order> findByOrderDateBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);

    List<Order> findByPaymentNotificationSentFalseAndOrderDateBefore(java.time.LocalDateTime time);

    void deleteByProductId(Long productId);

    void deleteByRetailerId(Long retailerId);
}

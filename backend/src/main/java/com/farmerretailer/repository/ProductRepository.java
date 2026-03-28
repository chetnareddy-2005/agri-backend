package com.farmerretailer.repository;

import com.farmerretailer.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import org.springframework.data.repository.query.Param;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByFarmerId(Long farmerId);

    long countByFarmerId(Long farmerId);

    List<Product> findByCategoryContainingIgnoreCase(String category);

    List<Product> findByLocationContainingIgnoreCase(String location);

    @org.springframework.data.jpa.repository.Query("SELECT p.category, COUNT(p) FROM Product p WHERE p.farmer.id = :farmerId GROUP BY p.category")
    List<Object[]> countProductsByCategory(@Param("farmerId") Long farmerId);

    List<Product> findByBiddingEndTimeBeforeAndAuctionEndNotificationSentFalse(java.time.LocalDateTime now);

    List<Product> findByAvailableTrue();

    List<Product> findByAvailableTrueAndBiddingEndTimeBefore(java.time.LocalDateTime time);
}

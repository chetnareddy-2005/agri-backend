package com.farmerretailer.repository;

import com.farmerretailer.entity.Bid;
import com.farmerretailer.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.repository.query.Param;

@Repository
public interface BidRepository extends JpaRepository<Bid, Long> {
    List<Bid> findByProductIdOrderByAmountDesc(Long productId);

    @Query("SELECT MAX(b.amount) FROM Bid b WHERE b.product.id = :productId")
    Double findHighestBidAmountByProductId(@Param("productId") Long productId);

    @Query("SELECT DISTINCT b.retailer FROM Bid b WHERE b.product.id = :productId AND b.retailer.id != :retailerId")
    List<User> findDistinctRetailerByProductIdAndRetailerIdNot(@Param("productId") Long productId,
            @Param("retailerId") Long retailerId);

    Optional<Bid> findTopByProductIdOrderByAmountDesc(Long productId);

    List<Bid> findByRetailerId(Long retailerId);

    @Query("SELECT COUNT(DISTINCT b.product.id) FROM Bid b WHERE b.retailer.id = :retailerId AND b.product.available = true")
    Long countActiveBids(@Param("retailerId") Long retailerId);

    void deleteByProductId(Long productId);

    void deleteByRetailerId(Long retailerId);
}

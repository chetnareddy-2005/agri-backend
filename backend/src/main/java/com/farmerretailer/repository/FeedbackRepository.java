package com.farmerretailer.repository;

import com.farmerretailer.entity.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    boolean existsByOrderId(Long orderId);

    void deleteByOrderId(Long orderId);

    List<Feedback> findByOrder_Product_FarmerIdOrderByCreatedAtDesc(Long farmerId);
}

package com.farmerretailer.repository;

import com.farmerretailer.entity.Retailer;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface RetailerRepository extends JpaRepository<Retailer, Long> {
    Optional<Retailer> findByUserId(Long userId);
}

package com.farmerretailer.repository;

import com.farmerretailer.entity.Transport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TransportRepository extends JpaRepository<Transport, Long> {
    Optional<Transport> findByOrderId(Long orderId);
    List<Transport> findByStatus(String status);
    List<Transport> findByDriverId(Long driverId);
}

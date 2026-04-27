package com.farmerretailer.repository;

import com.farmerretailer.entity.Transport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TransportRepository extends JpaRepository<Transport, Long> {
    Optional<Transport> findByOrderId(Long orderId);
    @org.springframework.data.jpa.repository.Query("SELECT t FROM Transport t JOIN FETCH t.order o JOIN FETCH o.retailer r JOIN FETCH o.product p WHERE t.status = :status")
    List<Transport> findByStatusWithDetails(@org.springframework.data.repository.query.Param("status") String status);

    List<Transport> findByStatus(String status);
    @org.springframework.data.jpa.repository.Query("SELECT t FROM Transport t JOIN FETCH t.order o JOIN FETCH o.retailer r WHERE t.driver.id = :driverId")
    List<Transport> findByDriverId(@org.springframework.data.repository.query.Param("driverId") Long driverId);
    void deleteByDriverId(Long driverId);
}

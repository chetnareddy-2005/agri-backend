package com.farmerretailer.repository;

import com.farmerretailer.entity.ComplaintResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ComplaintResponseRepository extends JpaRepository<ComplaintResponse, Long> {
    void deleteByResponderId(Long responderId);
}

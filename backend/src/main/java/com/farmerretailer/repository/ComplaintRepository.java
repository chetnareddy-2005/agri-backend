package com.farmerretailer.repository;

import com.farmerretailer.entity.Complaint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, Long> {
    List<Complaint> findAllByOrderByTimestampDesc();

    List<Complaint> findByUserIdOrderByTimestampDesc(Long userId);

    void deleteByUserId(Long userId);
}

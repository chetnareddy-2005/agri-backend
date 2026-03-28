package com.farmerretailer.repository;

import com.farmerretailer.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    Boolean existsByEmail(String email);

    java.util.List<User> findByVerifiedFalse();

    long countByRole(com.farmerretailer.model.Role role);

    long countByRoleAndVerifiedTrue(com.farmerretailer.model.Role role);

    java.util.List<User> findByRole(com.farmerretailer.model.Role role);

    java.util.List<User> findByRoleAndVerifiedTrue(com.farmerretailer.model.Role role);
}

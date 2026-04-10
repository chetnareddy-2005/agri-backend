package com.farmerretailer.config;

import com.farmerretailer.entity.User;
import com.farmerretailer.model.Role;
import com.farmerretailer.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataSeeder {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    @Bean
    public CommandLineRunner initDatabase(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder
    ) {
        return args -> {

            createAdminIfNotExists(userRepository, passwordEncoder);
            createFarmerIfNotExists(userRepository, passwordEncoder);
            createRetailerIfNotExists(userRepository, passwordEncoder);

        };
    }

    private void createAdminIfNotExists(UserRepository userRepository,
                                        PasswordEncoder passwordEncoder) {

        if (userRepository.findByEmail("admin@agriconnect.com").isEmpty()) {
            User admin = new User();
            admin.setFullName("Admin");
            admin.setEmail("admin@agriconnect.com");
            admin.setPassword(passwordEncoder.encode("Admin@123"));
            admin.setRole(Role.ADMIN);
            admin.setMobileNumber("0000000000");
            admin.setVerified(true);
            admin.setActive(true);
            admin.setMustChangePassword(false);

            userRepository.save(admin);
            log.info("Default Admin user created: admin@agriconnect.com");
        }
    }

    private void createFarmerIfNotExists(UserRepository userRepository,
                                         PasswordEncoder passwordEncoder) {

        if (userRepository.findByEmail("farmer@test.com").isEmpty()) {
            User farmer = new User();
            farmer.setFullName("Test Farmer");
            farmer.setEmail("farmer@test.com");
            farmer.setPassword(passwordEncoder.encode("password"));
            farmer.setRole(Role.FARMER);
            farmer.setMobileNumber("1111111111");
            farmer.setVerified(true);
            farmer.setActive(true);
            farmer.setMustChangePassword(false);

            userRepository.save(farmer);
            log.info("Default Farmer created: farmer@test.com");
        }
    }

    private void createRetailerIfNotExists(UserRepository userRepository,
                                           PasswordEncoder passwordEncoder) {

        if (userRepository.findByEmail("retailer@test.com").isEmpty()) {
            User retailer = new User();
            retailer.setFullName("Test Retailer");
            retailer.setEmail("retailer@test.com");
            retailer.setPassword(passwordEncoder.encode("password"));
            retailer.setRole(Role.RETAILER);
            retailer.setMobileNumber("2222222222");
            retailer.setVerified(true);
            retailer.setActive(true);
            retailer.setMustChangePassword(false);

            userRepository.save(retailer);
            log.info("Default Retailer created: retailer@test.com");
        }
    }
}


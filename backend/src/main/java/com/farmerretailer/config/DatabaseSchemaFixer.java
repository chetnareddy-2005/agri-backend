package com.farmerretailer.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DatabaseSchemaFixer implements CommandLineRunner {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        try {
            System.out.println("Checking and fixing database schema for 'role' ENUM...");
            
            // 1. Temporarily change to VARCHAR to allow editing existing data
            jdbcTemplate.execute("ALTER TABLE users MODIFY role VARCHAR(50)");
            
            // 2. Strip 'ROLE_' prefix if it exists
            jdbcTemplate.execute("UPDATE users SET role = REPLACE(role, 'ROLE_', '')");
            
            // 3. Re-apply the ENUM with the new values
            jdbcTemplate.execute("ALTER TABLE users MODIFY role ENUM('ADMIN', 'FARMER', 'RETAILER', 'TRANSPORTER')");
            
            System.out.println("✅ Database schema for 'role' ENUM updated successfully!");
        } catch (Exception e) {
            System.out.println("⚠️ Note: Database schema update skipped or failed (it might already be updated): " + e.getMessage());
        }
    }
}

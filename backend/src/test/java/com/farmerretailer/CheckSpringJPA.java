package com.farmerretailer;

import com.farmerretailer.repository.UserRepository;
import com.farmerretailer.entity.User;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.util.List;

@SpringBootApplication
public class CheckSpringJPA {
    public static void main(String[] args) {
        System.setProperty("SPRING_DATASOURCE_URL", "jdbc:postgresql://ep-still-union-a4fzm9sr-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require");
        System.setProperty("SPRING_DATASOURCE_USERNAME", "neondb_owner");
        System.setProperty("SPRING_DATASOURCE_PASSWORD", "npg_L7iTeb9qjGZd");
        System.setProperty("SPRING_JPA_DATABASE_PLATFORM", "org.hibernate.dialect.PostgreSQLDialect");
        SpringApplication.run(CheckSpringJPA.class, args);
    }

    @Bean
    public CommandLineRunner run(UserRepository repo) {
        return args -> {
            System.out.println("====== TEST JPA ======");
            List<User> pending = repo.findByVerifiedFalse();
            System.out.println("Pending users count: " + pending.size());
            for (User u : pending) {
                System.out.println("- " + u.getEmail());
            }
            System.out.println("======================");
            System.exit(0);
        };
    }
}

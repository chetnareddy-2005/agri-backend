package com.farmerretailer;
import java.sql.*;
public class CheckDB {
    public static void main(String[] args) throws Exception {
        String url = "jdbc:postgresql://ep-still-union-a4fzm9sr-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require";
        try (Connection conn = DriverManager.getConnection(url, "neondb_owner", "npg_L7iTeb9qjGZd");
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT email, role, is_verified, is_active FROM users")) {
            System.out.println("===== USERS IN DATABASE =====");
            int count = 0;
            while (rs.next()) {
                count++;
                System.out.println(count + ". " + rs.getString("email") + " | Role: " + rs.getString("role") + " | Verified: " + rs.getBoolean("is_verified") + " | Active: " + rs.getBoolean("is_active"));
            }
            if (count == 0) {
                System.out.println("No users found in the database.");
            }
            System.out.println("=============================");
        } catch(Exception e) {
            e.printStackTrace();
        }
    }
}

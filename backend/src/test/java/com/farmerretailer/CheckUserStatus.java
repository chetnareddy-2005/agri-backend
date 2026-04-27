package com.farmerretailer;
import java.sql.*;
public class CheckUserStatus {
    public static void main(String[] args) throws Exception {
        String url = "jdbc:postgresql://ep-still-union-a4fzm9sr-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require";
        try (Connection conn = DriverManager.getConnection(url, "neondb_owner", "npg_L7iTeb9qjGZd");
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT email, is_verified, must_change_password, password FROM users WHERE email='chetnareddy2023@gmail.com'")) {
            if (rs.next()) {
                System.out.println("Email: " + rs.getString("email"));
                System.out.println("Verified: " + rs.getBoolean("is_verified"));
                System.out.println("Must Change Password: " + rs.getBoolean("must_change_password"));
                System.out.println("Password Hash: " + rs.getString("password"));
            } else {
                System.out.println("User not found!");
            }
        }
    }
}

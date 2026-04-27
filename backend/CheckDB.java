import java.sql.*;
public class CheckDB {
    public static void main(String[] args) throws Exception {
        String url = "jdbc:postgresql://ep-still-union-a4fzm9sr-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require";
        try (Connection conn = DriverManager.getConnection(url, "neondb_owner", "npg_L7iTeb9qjGZd");
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT email, role, is_verified FROM users")) {
            System.out.println("Users in database:");
            while (rs.next()) {
                System.out.println(rs.getString("email") + " | Role: " + rs.getString("role") + " | Verified: " + rs.getBoolean("is_verified"));
            }
        }
    }
}

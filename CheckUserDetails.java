import java.sql.*;

public class CheckUserDetails {
    public static void main(String[] args) {
        String url = "jdbc:postgresql://ep-calm-river-a59f5fno.us-east-2.aws.neon.tech/neondb?sslmode=require";
        String user = "neondb_owner";
        String pass = "npg_BfH9S2VpLNoU";

        try (Connection conn = DriverManager.getConnection(url, user, pass)) {
            String sql = "SELECT * FROM users WHERE email = 'chetnareddy2023@gmail.com'";
            try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
                ResultSet rs = pstmt.executeQuery();
                if (rs.next()) {
                    ResultSetMetaData rsmd = rs.getMetaData();
                    int columnsNumber = rsmd.getColumnCount();
                    for (int i = 1; i <= columnsNumber; i++) {
                        String columnValue = rs.getString(i);
                        System.out.println(rsmd.getColumnName(i) + ": " + columnValue);
                    }
                } else {
                    System.out.println("User not found");
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}

# Stage 1: Build the app
FROM maven:3.9.9-eclipse-temurin-17 AS builder

WORKDIR /app
COPY . .

# Since pom.xml is in the backend folder, we switch there
WORKDIR /app/backend
RUN mvn clean package -DskipTests

# Stage 2: Run the app
FROM eclipse-temurin:17

WORKDIR /app

# Copy the generated JAR from the backend target folder
COPY --from=builder /app/backend/target/*.jar app.jar

EXPOSE 8080

CMD ["java", "-jar", "app.jar"]

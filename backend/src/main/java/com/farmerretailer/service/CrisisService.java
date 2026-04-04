package com.farmerretailer.service;

import com.farmerretailer.entity.Weather;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class CrisisService {

    @Autowired
    private WeatherService weatherService;
    
    @Autowired
    private NotificationService notificationService;
    
    @Autowired
    private com.farmerretailer.repository.UserRepository userRepository;

    private static Map<String, CrisisInfo> activeCrises = new HashMap<>();

    @Data
    public static class CrisisInfo {
        private String location;
        private String type; // WEATHER, ROAD_BLOCK, LOGISTICS_DELAY
        private String severity; // LOW, MEDIUM, HIGH
        private String message;
        private long startTime;
    }

    public List<CrisisInfo> getActiveCrisesForLocation(String location) {
        // AI Logic: Detect crisis based on weather
        Weather w = weatherService.getLatestWeather(location);
        List<CrisisInfo> crises = new ArrayList<>();
        
        if (w != null) {
            if (w.getWeatherCondition().toLowerCase().contains("rain") || w.getTemperature() > 40) {
                CrisisInfo weatherCrisis = new CrisisInfo();
                weatherCrisis.location = location;
                weatherCrisis.type = "WEATHER";
                weatherCrisis.severity = w.getRainProbability() > 70 ? "HIGH" : "MEDIUM";
                weatherCrisis.message = "Severe weather detected: " + w.getWeatherCondition();
                weatherCrisis.startTime = System.currentTimeMillis();
                crises.add(weatherCrisis);
            }
        }
        
        // Add manual or simulated road blockages
        if (activeCrises.containsKey(location)) {
            crises.add(activeCrises.get(location));
        }
        
        return crises;
    }

    public void triggerRoadBlockage(String location, String message) {
        CrisisInfo roadCrisis = new CrisisInfo();
        roadCrisis.location = location;
        roadCrisis.type = "ROAD_BLOCK";
        roadCrisis.severity = "HIGH";
        roadCrisis.message = message;
        roadCrisis.startTime = System.currentTimeMillis();
        activeCrises.put(location, roadCrisis);
        
        // Notify all users in that location
        userRepository.findAll().stream()
            .filter(u -> location.equalsIgnoreCase(u.getBusinessName()) || location.equalsIgnoreCase(u.getAddress()))
            .forEach(u -> notificationService.createNotification(u, "🚨 ROAD BLOCKAGE!", message, "alert"));
    }

    public String resolveRiskLevel(String location) {
        List<CrisisInfo> crises = getActiveCrisesForLocation(location);
        if (crises.isEmpty()) return "SAFE";
        
        boolean high = crises.stream().anyMatch(c -> "HIGH".equals(c.getSeverity()));
        if (high) return "HIGH RISK";
        return "MODERATE RISK";
    }
}

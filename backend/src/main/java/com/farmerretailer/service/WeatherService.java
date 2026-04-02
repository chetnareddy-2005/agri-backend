package com.farmerretailer.service;

import com.farmerretailer.entity.Weather;
import com.farmerretailer.repository.WeatherRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.json.JSONObject;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class WeatherService {
    @Autowired
    private WeatherRepository weatherRepository;

    private final String API_KEY = "fbae123ad5644e87952133011260204"; // Provided by user
    private final String WEATHER_URL = "http://api.weatherapi.com/v1/current.json?key=" + API_KEY + "&q=";

    public Weather getLatestWeather(String location) {
        Optional<Weather> existing = weatherRepository.findByLocation(location);
        
        // Refresh every 1 hour (simulated shorter duration for demo)
        if (existing.isPresent()) {
            Weather w = existing.get();
            if (w.getIsManualOverride() || w.getLastUpdated().isAfter(LocalDateTime.now().minusHours(1))) {
                return w;
            }
        }
        
        return fetchAndStoreWeather(location);
    }

    @Autowired
    private com.farmerretailer.repository.UserRepository userRepository;
    @Autowired
    private com.farmerretailer.service.NotificationService notificationService;

    private Weather fetchAndStoreWeather(String location) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            String response = restTemplate.getForObject(WEATHER_URL + location + "&aqi=no", String.class);
            JSONObject json = new JSONObject(response);
            JSONObject current = json.getJSONObject("current");
            
            Weather weather = weatherRepository.findByLocation(location).orElse(new Weather());
            weather.setLocation(location);
            weather.setTemperature(current.getDouble("temp_c"));
            weather.setCondition(current.getJSONObject("condition").getString("text"));
            weather.setHumidity(current.getDouble("humidity"));
            weather.setWindSpeed(current.getDouble("wind_kph"));
            weather.setRainProbability(current.getDouble("precip_mm") > 0 ? 80.0 : 10.0); 
            weather.setLastUpdated(LocalDateTime.now());
            weather.setIsManualOverride(false);
            
            Weather saved = weatherRepository.save(weather);
            
            // Generate Alerts if severe
            if (saved.getCondition().toLowerCase().contains("rain") || saved.getTemperature() > 40) {
                sendWeatherAlerts(saved);
            }
            
            return saved;
        } catch (Exception e) {
            System.err.println("Weather API Error: " + e.getMessage());
            return weatherRepository.findByLocation(location).orElse(null);
        }
    }

    private void sendWeatherAlerts(Weather w) {
       String alertMsg = w.getCondition().toLowerCase().contains("rain") ? 
          "🌧️ Heavy rain alert for " + w.getLocation() + "! Logistics delays and price surges likely." :
          "🔥 Heatwave warning in " + w.getLocation() + "! Take precautions for fresh produce.";
       
       List<com.farmerretailer.entity.User> users = userRepository.findAll(); // Simple: Alert all
       for(com.farmerretailer.entity.User u : users) {
           notificationService.createNotification(u, "Weather Alert: " + w.getCondition(), alertMsg, "alert", null);
       }
    }

    public Map<String, String> getAISuggestionsForFarmer(Weather w) {
        Map<String, String> suggestions = new HashMap<>();
        if (w == null) return suggestions;

        if (w.getCondition().toLowerCase().contains("rain")) {
            suggestions.put("crop", "💧 Rain expected → Rice or Sugarcane recommended for planting.");
            suggestions.put("timing", "⏳ Avoid harvesting for next 24 hours to prevent crop damage.");
            suggestions.put("risk", "🚨 High root-rot risk identified due to excess water.");
        } else if (w.getTemperature() > 35) {
            suggestions.put("crop", "☀️ Heatwave detected → Drought-resistant crops like Millets suggested.");
            suggestions.put("timing", "💧 Increase irrigation frequency during early morning hours.");
            suggestions.put("risk", "🚨 High heat stress alert for sensitive crops.");
        } else {
            suggestions.put("crop", "🌾 Clear weather → Good for Vegetables and Grains.");
            suggestions.put("timing", "✅ Perfect window for harvesting dry crops today.");
            suggestions.put("risk", "🟢 Normal risk level. Proceed with standard growth cycle.");
        }
        return suggestions;
    }

    public Map<String, String> getAIInsightsForRetailer(Weather w) {
        Map<String, String> insights = new HashMap<>();
        if (w == null) return insights;

        if (w.getCondition().toLowerCase().contains("rain")) {
            insights.put("demand", "📈 Rainy weather detected → Demand for storable staples like Grains will surge (+15%).");
            insights.put("pricing", "🚨 Supply chains may slowdown. Buying now will save 10% on future spike.");
            insights.put("inventory", "📦 Suggestion: Stock up on root vegetables; supply volume will drop tomorrow.");
        } else {
            insights.put("demand", "🟢 Favorable weather → Stable supply and consumer demand.");
            insights.put("pricing", "✅ Current prices are optimal. Best time for fresh produce bulk buying.");
            insights.put("inventory", "📦 Standard inventory refresh recommended.");
        }
        return insights;
    }

    public double calculateWeatherSurcharge(Weather w) {
        if (w == null) return 0.0;
        if (w.getCondition().toLowerCase().contains("rain")) return 10.0; // Rain surge
        if (w.getTemperature() > 40) return 5.0; // Heat surge (handling difficulty)
        return 0.0;
    }

    public String getWeatherImpactReason(Weather w) {
        if (w == null) return "Normal conditions";
        if (w.getCondition().toLowerCase().contains("rain")) return "🌧️ Rainy Conditions: Price Surge (+₹10) & Delay expected (~20m).";
        if (w.getTemperature() > 40) return "🔥 Heat Alert: Surcharge (+₹5) & Caution for fresh goods.";
        return "☀️ Favorable weather: Normal speed delivery.";
    }

    public Weather updateWeatherManual(Long id, Weather newWeather) {
        Weather existing = weatherRepository.findById(id).orElseThrow();
        existing.setTemperature(newWeather.getTemperature());
        existing.setCondition(newWeather.getCondition());
        existing.setAlerts(newWeather.getAlerts());
        existing.setIsManualOverride(true);
        existing.setLastUpdated(LocalDateTime.now());
        return weatherRepository.save(existing);
    }
}

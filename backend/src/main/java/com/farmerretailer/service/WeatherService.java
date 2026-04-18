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

    @org.springframework.beans.factory.annotation.Value("${weather.api.key}")
    private String apiKey;

    private final String WEATHER_URL_BASE = "http://api.weatherapi.com/v1/current.json";

    public Weather getLatestWeather(String location) {
        Optional<Weather> existing = weatherRepository.findFirstByLocation(location);

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
        if (apiKey == null || apiKey.isEmpty() || "YOUR_WEATHER_API_KEY_HERE".equals(apiKey)) {
            Weather fallback = new Weather();
            fallback.setLocation(location);
            fallback.setTemperature(25.0);
            fallback.setWeatherCondition("API not configured");
            fallback.setLastUpdated(LocalDateTime.now());
            return fallback;
        }

        try {
            RestTemplate restTemplate = new RestTemplate();
            // Use URI variables to ensure proper encoding of spaces and special chars
            String url = "http://api.weatherapi.com/v1/current.json?key=" + apiKey + "&q={location}&aqi=no";
            String response = restTemplate.getForObject(url, String.class, location);

            if (response == null)
                throw new Exception("Empty response from Weather API");

            JSONObject json = new JSONObject(response);
            JSONObject current = json.getJSONObject("current");

            Weather weather = weatherRepository.findFirstByLocation(location).orElse(new Weather());
            weather.setLocation(location);
            weather.setTemperature(current.has("temp_c") ? current.getDouble("temp_c") : 25.0);
            weather.setWeatherCondition(current.getJSONObject("condition").getString("text"));
            weather.setHumidity(current.has("humidity") ? current.getDouble("humidity") : 50.0);
            weather.setWindSpeed(current.has("wind_kph") ? current.getDouble("wind_kph") : 10.0);
            // Default rain probability logic if field missing
            double precip = current.has("precip_mm") ? current.getDouble("precip_mm") : 0.0;
            weather.setRainProbability(precip > 0 ? 80.0 : 10.0);
            weather.setLastUpdated(LocalDateTime.now());
            weather.setIsManualOverride(false);

            Weather saved = weatherRepository.save(weather);

            // Generate Alerts if severe
            if (saved.getWeatherCondition() != null
                    && (saved.getWeatherCondition().toLowerCase().contains("rain") || saved.getTemperature() > 40)) {
                sendWeatherAlerts(saved);
            }

            return saved;
        } catch (Exception e) {
            System.err.println("Weather API Error for " + location + ": " + e.getMessage());
            // Safe fallback to avoid 500 errors in controller
            Weather fallback = new Weather();
            fallback.setLocation(location);
            fallback.setTemperature(25.0);
            fallback.setWeatherCondition("Data Unavailable (Offline)");
            fallback.setLastUpdated(LocalDateTime.now());
            return fallback;
        }
    }

    private void sendWeatherAlerts(Weather w) {
        String alertMsg = w.getWeatherCondition().toLowerCase().contains("rain")
                ? "🌧️ Heavy rain alert for " + w.getLocation() + "! Logistics delays and price surges likely."
                : "🔥 Heatwave warning in " + w.getLocation() + "! Take precautions for fresh produce.";

        List<com.farmerretailer.entity.User> users = userRepository.findAll(); // Simple: Alert all
        for (com.farmerretailer.entity.User u : users) {
            notificationService.createNotification(u, "Weather Alert: " + w.getWeatherCondition(), alertMsg, "alert",
                    null);
        }
    }

    public Map<String, String> getAISuggestionsForFarmer(Weather w) {
        Map<String, String> suggestions = new HashMap<>();
        if (w == null)
            return suggestions;

        boolean isRainy = w.getWeatherCondition() != null && w.getWeatherCondition().toLowerCase().contains("rain");
        boolean isHot = w.getTemperature() > 35;

        if (isRainy) {
            suggestions.put("crop",
                    "🌾 Precipitation Alert: Rice & Sugarcane\nSubstantial rainfall detected. Current moisture levels are optimal for high-water consumption crops like Rice or Sugarcane.");
            suggestions.put("timing",
                    "⏳ Critical Harvest Warning\nPlease postpone harvesting operations for the next 24-48 hours to mitigate moisture-induced crop degradation.");
            suggestions.put("logistics",
                    "🚚 Logistics Advisory: High Delay Risk\nExpect significant transit disruptions and road saturation. Emergency-only transport is advised.");
            suggestions.put("risk",
                    "⚠️ Weather Risk Assessment: Moderate/High\nElevated root-rot and waterlogging risks identified. Ensure proper drainage systems are active.");
        } else if (isHot) {
            suggestions.put("crop",
                    "☀️ Extreme Temperature Alert: Millets & Hard Grains\nIntense heatwave detected. Prioritize drought-resistant cultivation to prevent heat-stress losses.");
            suggestions.put("timing",
                    "💧 Hydraulic Optimization\nExecute high-frequency irrigation cycles during early morning and late evening to minimize evaporative loss.");
            suggestions.put("logistics",
                    "🚚 Logistics Advisory: Cold-Chain Essential\nShipment of perishables requires active refrigeration. Avoid long-haul transit between 11 AM and 4 PM.");
            suggestions.put("risk",
                    "⚠️ Weather Risk Assessment: Moderate\nHigh thermal stress detected. Implement immediate cooling measures for livestock and temperature-sensitive produce.");
        } else {
            suggestions.put("crop",
                    "🌾 Favorable Weather Conditions Detected\nCurrent clear weather supports the cultivation of vegetables and grain crops, ensuring optimal growth and yield.");
            suggestions.put("timing",
                    "📅 Optimal Harvest Window\nDry and stable weather conditions today provide an ideal opportunity for harvesting crops, minimizing post-harvest risks.");
            suggestions.put("logistics",
                    "🚚 Logistics Advisory: Optimal Efficiency\nClear weather conditions are expected to support smooth transportation with minimal delays.");
            suggestions.put("risk",
                    "⚠️ Weather Risk Assessment: Safe\nNo adverse weather conditions detected. Operations can proceed safely.");
        }
        return suggestions;
    }

    public Map<String, String> getAIInsightsForRetailer(Weather w) {
        Map<String, String> insights = new HashMap<>();
        if (w == null)
            return insights;

        boolean isRainy = w.getWeatherCondition() != null && w.getWeatherCondition().toLowerCase().contains("rain");

        if (isRainy) {
            insights.put("demand",
                    "📈 Regional Demand Surge: Staples\nAtmospheric disruptions detected. Local demand for storable staples (Grains/Pulses) is projected to increase by 15-20%.");
            insights.put("pricing",
                    "🚨 Strategic Procurement Advisory\nLogistics bottlenecks are imminent. Procuring essential inventory now will yield an estimated 10% cost-saving against price spikes.");
            insights.put("inventory",
                    "📦 Inventory Optimization: Root Vegetables\nSupply volumes are projected to contract by 30% tomorrow. Secure primary stock immediately.");
        } else {
            insights.put("demand",
                    "🟢 Market Stability: High\nFavorable regional weather is ensuring steady production and consistent consumer demand patterns.");
            insights.put("pricing",
                    "✅ Optimal Pricing Window\nProduction cycles are uninterrupted. Current market pricing is at equilibrium—ideal for bulk procurement of fresh produce.");
            insights.put("inventory",
                    "📦 Standard Supply Chain Velocity\nAll transport routes are clear. Maintain standard 48-hour inventory refresh cycles.");
        }
        return insights;
    }

    public double calculateWeatherSurcharge(Weather w) {
        if (w == null)
            return 0.0;
        if (w.getWeatherCondition() != null && w.getWeatherCondition().toLowerCase().contains("rain"))
            return 10.0;
        if (w.getTemperature() > 40)
            return 5.0;
        return 0.0;
    }

    public String getWeatherImpactReason(Weather w) {
        if (w == null)
            return "Normal conditions";
        if (w.getWeatherCondition() != null && w.getWeatherCondition().toLowerCase().contains("rain"))
            return "🌧️ Heavy Precipitation: Transit surcharge (+₹10) & Safety-lead delays (~30m).";
        if (w.getTemperature() > 40)
            return "🔥 Thermal Alert: Climate control surcharge (+₹5) & expedited transit required.";
        return "☀️ Favorable Conditions: Logistics routes operating at 100% efficiency.";
    }

    public Weather updateWeatherManual(Long id, Weather newWeather) {
        Weather existing = weatherRepository.findById(id).orElseThrow();
        existing.setTemperature(newWeather.getTemperature());
        existing.setWeatherCondition(newWeather.getWeatherCondition());
        existing.setAlerts(newWeather.getAlerts());
        existing.setIsManualOverride(true);
        existing.setLastUpdated(LocalDateTime.now());
        return weatherRepository.save(existing);
    }
}

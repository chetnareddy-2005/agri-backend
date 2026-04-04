package com.farmerretailer.controller;

import com.farmerretailer.entity.Weather;
import com.farmerretailer.service.WeatherService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/weather")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176"}, allowCredentials = "true")
public class WeatherController {
    @Autowired
    private WeatherService weatherService;

    @GetMapping("/{location}")
    public ResponseEntity<Weather> getWeather(@PathVariable String location) {
        return ResponseEntity.ok(weatherService.getLatestWeather(location));
    }

    @GetMapping("/{location}/farmer-ai")
    public ResponseEntity<Map<String, String>> getFarmerAI(@PathVariable String location) {
        Weather w = weatherService.getLatestWeather(location);
        return ResponseEntity.ok(weatherService.getAISuggestionsForFarmer(w));
    }

    @GetMapping("/{location}/retailer-ai")
    public ResponseEntity<Map<String, String>> getRetailerAI(@PathVariable String location) {
        Weather w = weatherService.getLatestWeather(location);
        return ResponseEntity.ok(weatherService.getAIInsightsForRetailer(w));
    }

    @PutMapping("/{id}/override")
    public ResponseEntity<Weather> overrideWeather(@PathVariable Long id, @RequestBody Weather weather) {
        return ResponseEntity.ok(weatherService.updateWeatherManual(id, weather));
    }
}

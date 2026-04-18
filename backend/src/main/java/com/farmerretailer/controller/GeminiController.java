package com.farmerretailer.controller;

import com.farmerretailer.service.GeminiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/gemini")
@CrossOrigin(origins = "*") // For local testing
public class GeminiController {

    @Autowired
    private GeminiService geminiService;

    @PostMapping("/security-analysis")
    public ResponseEntity<String> getSecurityAnalysis(@RequestBody Map<String, Object> data) {
        String analysis = geminiService.analyzeSecurityAnomaly(data);
        return ResponseEntity.ok(analysis);
    }

    @PostMapping("/weather-advice")
    public ResponseEntity<String> getWeatherAdvice(@RequestBody Map<String, Object> data) {
        String advice = geminiService.generateWeatherAdvice(data);
        return ResponseEntity.ok(advice);
    }
}

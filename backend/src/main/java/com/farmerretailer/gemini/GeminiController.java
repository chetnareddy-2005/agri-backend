package com.farmerretailer.gemini;

import com.farmerretailer.gemini.dto.SecurityAnalysisRequest;
import com.farmerretailer.gemini.dto.WeatherAdviceRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/v1/gemini")
@CrossOrigin(origins = "*")
public class GeminiController {

    @Autowired
    private GeminiAIService geminiAIService;

    @PostMapping("/security-analysis")
    public ResponseEntity<Map<String, String>> securityAnalysis(@RequestBody SecurityAnalysisRequest request) {
        String insight = geminiAIService.analyzeSecurity(request);
        Map<String, String> response = new HashMap<>();
        response.put("analysis", insight);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/weather-advice")
    public ResponseEntity<Map<String, String>> weatherAdvice(@RequestBody WeatherAdviceRequest request) {
        String advice = geminiAIService.analyzeWeather(request);
        Map<String, String> response = new HashMap<>();
        response.put("advice", advice);
        return ResponseEntity.ok(response);
    }
}

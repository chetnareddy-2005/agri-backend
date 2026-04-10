package com.farmerretailer.gemini;

import com.farmerretailer.gemini.dto.SecurityAnalysisRequest;
import com.farmerretailer.gemini.dto.WeatherAdviceRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.util.HashMap;
import java.util.Map;
import java.util.List;

@SuppressWarnings("unchecked")
@Service
public class GeminiAIService {

    @Value("${gemini.api.key:YOUR_GEMINI_API_KEY_HERE}")
    private String geminiApiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private static final String GEMINI_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=";

    public String analyzeSecurity(SecurityAnalysisRequest request) {
        String prompt = String.format(
            "Act as a cybersecurity analyst. A continuous authentication ML system flagged this user behavior.\n" +
            "Data:\nTyping Speed: %s WPM\nMouse Avg Speed: %s px/s\nScroll Frequency: %s scrolls/min\nIP: %s\nML Risk Score: %s\n\n" +
            "Task: Briefly explain why this is suspicious. Conclude with a recommendation of EXACTLY ONE of the following tags: [ALLOW], [OTP], or [BLOCK].",
            request.getTypingSpeedWpm(), request.getMouseMovementAvgSpeed(), request.getScrollFrequency(),
            request.getIpAddress(), request.getRiskScore()
        );
        return callGemini(prompt);
    }

    public String analyzeWeather(WeatherAdviceRequest request) {
        String prompt = String.format(
            "Act as an expert agronomist. Location: %s. Weather Conditions: Temperature: %s°C, Humidity: %s%%, Rainfall: %s mm.\n\n" +
            "Task: Generate brief, practical advice for farmers. Format cleanly. Include:\n1. Crop advice\n2. Harvest suggestions\n3. Environmental risk warnings.",
            request.getCity(), request.getTemperature(), request.getHumidity(), request.getRainfall()
        );
        return callGemini(prompt);
    }

    private String callGemini(String prompt) {
        String url = GEMINI_URL + geminiApiKey;

        // Construct Gemini JSON payload
        Map<String, Object> textPart = new HashMap<>();
        textPart.put("text", prompt);

        // Required Gemini prompt structure
        Map<String, Object> content = new HashMap<>();
        content.put("parts", List.of(textPart));

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", List.of(content));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            Map<String, Object> body = response.getBody();
            if (body != null && body.containsKey("candidates")) {
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) body.get("candidates");
                if (!candidates.isEmpty()) {
                    Map<String, Object> contentMap = (Map<String, Object>) candidates.get(0).get("content");
                    List<Map<String, Object>> parts = (List<Map<String, Object>>) contentMap.get("parts");
                    return (String) parts.get(0).get("text");
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            return "Gemini API Error: " + e.getMessage();
        }
        return "No insights generated.";
    }
}

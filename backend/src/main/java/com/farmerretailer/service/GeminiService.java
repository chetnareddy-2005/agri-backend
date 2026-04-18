package com.farmerretailer.service;

import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class GeminiService {

    @Value("${GEMINI_API_KEY:}")
    private String apiKey;

    private final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=";

    private final RestTemplate restTemplate = new RestTemplate();

    public String analyzeSecurityAnomaly(Map<String, Object> data) {
        String prompt = String.format(
                "System: You are a Security AI assistant for a Farmer-Retailer platform.\n" +
                "Evaluate the following suspicious user behavior and provide a JSON response with 'explanation' and 'suggestedAction' (ALLOW, OTP, BLOCK).\n\n" +
                "Behavior Data:\n" +
                "- Typing Speed: %s\n" +
                "- Mouse Movement (Avg Dist): %s\n" +
                "- Device Info: %s\n" +
                "- IP Address: %s\n" +
                "- Risk Score (Base): %s\n\n" +
                "Output format: { \"explanation\": \"...\", \"suggestedAction\": \"...\" }",
                data.get("typing_speed"), data.get("mouse_movement"), data.get("device_info"), 
                data.get("ip_address"), data.get("risk_score")
        );

        return callGemini(prompt);
    }

    public String generateWeatherAdvice(Map<String, Object> data) {
        String prompt = String.format(
                "System: You are an Agricultural Weather Intelligence AI.\n" +
                "Generate crop advice, harvest suggestions, and risk warnings based on this weather data.\n\n" +
                "Weather Data:\n" +
                "- City: %s\n" +
                "- Temperature: %s°C\n" +
                "- Humidity: %s%%\n" +
                "- Rainfall: %s mm\n\n" +
                "Output format: { \"cropAdvice\": \"...\", \"harvestSuggestions\": \"...\", \"riskWarnings\": \"...\" }",
                data.get("city"), data.get("temperature"), data.get("humidity"), data.get("rainfall")
        );

        return callGemini(prompt);
    }

    private String callGemini(String prompt) {
        if (apiKey == null || apiKey.isEmpty() || "YOUR_GEMINI_API_KEY_HERE".equals(apiKey)) {
            return "{ \"error\": \"API Key not configured\" }";
        }

        try {
            JSONObject requestBody = new JSONObject();
            JSONArray contents = new JSONArray();
            JSONObject content = new JSONObject();
            JSONArray parts = new JSONArray();
            JSONObject part = new JSONObject();
            
            part.put("text", prompt);
            parts.put(part);
            content.put("parts", parts);
            contents.put(content);
            requestBody.put("contents", contents);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> entity = new HttpEntity<>(requestBody.toString(), headers);

            ResponseEntity<String> response = restTemplate.postForEntity(GEMINI_API_URL + apiKey, entity, String.class);
            
            // Extract the text content from Gemini's nested response structure
            JSONObject responseJson = new JSONObject(response.getBody());
            String resultText = responseJson.getJSONArray("candidates")
                    .getJSONObject(0)
                    .getJSONObject("content")
                    .getJSONArray("parts")
                    .getJSONObject(0)
                    .getString("text");
                    
            return resultText;
        } catch (Exception e) {
            return "{ \"error\": \"Gemini API call failed: " + e.getMessage() + "\" }";
        }
    }
}

package com.farmerretailer.continuousauth;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

@Service
public class AnomalyDetectionService {

    private final RestTemplate restTemplate = new RestTemplate();
    // Assuming the Flask app runs locally on port 5000
    private final String FLASK_API_URL = "http://127.0.0.1:5000/api/v1/auth/predict";

    public ContinuousAuthResponseDTO evaluateRisk(ContinuousAuthRequestDTO requestDTO) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<ContinuousAuthRequestDTO> request = new HttpEntity<>(requestDTO, headers);
            ResponseEntity<ContinuousAuthResponseDTO> response = restTemplate.postForEntity(
                    FLASK_API_URL, request, ContinuousAuthResponseDTO.class);

            return response.getBody();
        } catch (Exception e) {
            // Log the error and fail open (LOW risk) if the AI service is unreachable,
            // or fail closed depending on security requirements. Here we fail open.
            ContinuousAuthResponseDTO fallback = new ContinuousAuthResponseDTO();
            fallback.setUserId(requestDTO.getUserId());
            fallback.setRiskLevel("LOW");
            fallback.setScore(0.0);
            return fallback;
        }
    }
}

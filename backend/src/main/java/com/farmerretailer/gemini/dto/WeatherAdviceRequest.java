package com.farmerretailer.gemini.dto;

public class WeatherAdviceRequest {
    private Double temperature;
    private Double humidity;
    private Double rainfall;
    private String city;

    public Double getTemperature() { return temperature; }
    public void setTemperature(Double temperature) { this.temperature = temperature; }

    public Double getHumidity() { return humidity; }
    public void setHumidity(Double humidity) { this.humidity = humidity; }

    public Double getRainfall() { return rainfall; }
    public void setRainfall(Double rainfall) { this.rainfall = rainfall; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
}

package com.farmerretailer.config;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class TokenRegistry {
    private final ConcurrentHashMap<String, Authentication> tokenMap = new ConcurrentHashMap<>();

    public void registerToken(String token, Authentication authentication) {
        tokenMap.put(token, authentication);
    }

    public Authentication getAuthentication(String token) {
        return tokenMap.get(token);
    }

    public void removeToken(String token) {
        if (token != null) {
            tokenMap.remove(token);
        }
    }
}

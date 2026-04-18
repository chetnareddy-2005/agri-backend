package com.farmerretailer.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;

public class TokenAuthenticationFilter extends OncePerRequestFilter {

    private final TokenRegistry tokenRegistry;

    public TokenAuthenticationFilter(TokenRegistry tokenRegistry) {
        this.tokenRegistry = tokenRegistry;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        String token = request.getHeader("X-Auth-Token");
        
        if (token != null && !token.isEmpty()) {
            Authentication authentication = tokenRegistry.getAuthentication(token);
            if (authentication != null) {
                System.out.println("[Auth Debug] Valid token found: " + token + " for user: " + authentication.getName());
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } else {
                System.out.println("[Auth Debug] Token present but NOT found in registry: " + token);
            }
        }

        filterChain.doFilter(request, response);
    }
}

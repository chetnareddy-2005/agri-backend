package com.farmerretailer.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class SecurityConfig {

    private final TokenRegistry tokenRegistry;

    public SecurityConfig(TokenRegistry tokenRegistry) {
        this.tokenRegistry = tokenRegistry;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public org.springframework.security.authentication.AuthenticationManager authenticationManager(
            org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration authenticationConfiguration)
            throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public org.springframework.security.web.SecurityFilterChain securityFilterChain(
            org.springframework.security.config.annotation.web.builders.HttpSecurity http) throws Exception {
        
        org.springframework.security.web.context.SecurityContextRepository repo = new org.springframework.security.web.context.HttpSessionSecurityContextRepository();

        http
                .csrf(csrf -> csrf.disable())
                .headers(headers -> headers.frameOptions(frameOptions -> frameOptions.disable()))
                .cors(cors -> cors.configurationSource(request -> {
                    org.springframework.web.cors.CorsConfiguration config = new org.springframework.web.cors.CorsConfiguration();
                    config.setAllowedOrigins(java.util.Arrays.asList(
                            "http://localhost:5173", 
                            "http://localhost:5174",
                            "http://localhost:5175",
                            "http://localhost:5176",
                            "http://127.0.0.1:5173",
                            "http://127.0.0.1:5174",
                            "https://chetnareddy-2005.github.io",
                            "https://matcher-sculpture-delay.ngrok-free.app"
                    )); // Frontend URLs
                    config.setAllowedMethods(java.util.Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
                    config.setAllowedHeaders(java.util.Arrays.asList("Authorization", "Content-Type", "X-Auth-Token", "Accept"));
                    config.setAllowCredentials(true);
                    config.setMaxAge(3600L);
                    return config;
                }))
                .addFilterBefore(new TokenAuthenticationFilter(tokenRegistry), org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter.class)
                .securityContext(context -> context.securityContextRepository(repo))
                .sessionManagement(session -> session.sessionCreationPolicy(org.springframework.security.config.http.SessionCreationPolicy.IF_REQUIRED))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/v1/telemetry/**").permitAll()
                        .requestMatchers("/api/v1/gemini/**").permitAll()
                        .anyRequest().authenticated())
                .exceptionHandling(e -> e
                        .authenticationEntryPoint(
                                new org.springframework.security.web.authentication.HttpStatusEntryPoint(
                                        org.springframework.http.HttpStatus.UNAUTHORIZED)));

        return http.build();
    }
}

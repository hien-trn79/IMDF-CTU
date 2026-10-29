package com.example.backend_imdf_ctu.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.ExchangeFilterFunctions;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
@Getter
public class GeoServerConfig {

    @Value("${geoserver.url}")
    private String baseUrl;

    @Value("${geoserver.username}")
    private String username;

    @Value("${geoserver.password}")
    private String password;

    @Value("${geoserver.workspace}")
    private String defaultWorkspace;

    @Value("${geoserver.datastore}")
    private String defaultDatastore;

    @Bean
    public WebClient geoServerWebClient() {
        return WebClient.builder()
            .baseUrl(baseUrl + "/rest")
            .filter(ExchangeFilterFunctions.basicAuthentication(username, password))
            .build();
    }
}

package com.example.backend_imdf_ctu.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    final String securitySchemeName = "bearerAuth";

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("IMDF CTU Website Backend API")
                .version("1.0.0")
                .description("RESTful API documentation for IMDF CTU Backend")
                .contact(new Contact()
                    .name("hinTran")
                    .email("thuyhien2005lv@gmail.com")
                    .url("https://github.com/hien-trn79"))
                .license(new License()
                    .name("Apache 2.0")
                    .url("https://springdoc.org")))
            .addSecurityItem(
                new SecurityRequirement()
                    .addList(securitySchemeName)
            )

            .components(
                new Components()
                    .addSecuritySchemes(
                        securitySchemeName,
                        new SecurityScheme()
                            .name(securitySchemeName)
                            .type(SecurityScheme.Type.HTTP)
                            .scheme("bearer")
                            .bearerFormat("JWT")
                    )
            );
    }
}
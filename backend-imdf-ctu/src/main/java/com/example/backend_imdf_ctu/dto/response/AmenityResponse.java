package com.example.backend_imdf_ctu.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AmenityResponse {
    private Integer id;
    private String amenityId; // UUID as String
    private String geometry; // WKT format for Point
    private String phone;
    private String website;
    private LocalDateTime hours;
    private String correlationId; // UUID as String

    private Integer amenityCategoryId;
    private Integer featureId;
}

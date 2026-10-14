package com.example.backend_imdf_ctu.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AmenityRequest {
    private String geometry; // WKT format for Point
    private String phone;
    private String website;
    private LocalDateTime hours;

    private Integer amenityCategoryId;
    private Integer featureId;
}

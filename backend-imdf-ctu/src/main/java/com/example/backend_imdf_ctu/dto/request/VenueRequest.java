package com.example.backend_imdf_ctu.dto.request;

import lombok.Data;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
public class VenueRequest {
    private String venueName;

    private GeoJsonGeometry geometry; // WKT representation of MultiPolygon

    private LocalDateTime hours;

    private String phone;

    private String website;

    private GeoJsonGeometry displayPoint; // WKT representation of Point

    private Integer featureId;

    private Integer venueCategoryId;

    private Integer addressId;

    private Integer restrictionCategoryId;


}

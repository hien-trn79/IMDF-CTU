package com.example.backend_imdf_ctu.dto.response;

import com.example.backend_imdf_ctu.dto.request.GeoJsonGeometry;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VenueResponse {
    private Integer id;

    private String venueId;

    private GeoJsonGeometry geometry; // WKT representation of MultiPolygon

    private LocalDateTime hours;

    private String phone;

    private String website;

    private GeoJsonGeometry displayPoint; // WKT representation of Point

    private Integer featureId;

    private Integer venueCategoryId;
    private String venueCategoryName;

    private Integer addressId;
    private String addressName;

    private Integer restrictionCategoryId;
    private String restrictionCategoryName;
}

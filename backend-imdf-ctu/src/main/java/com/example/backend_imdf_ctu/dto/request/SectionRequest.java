package com.example.backend_imdf_ctu.dto.request;

import lombok.Data;

@Data
public class SectionRequest {
    private String sectionName;

    private GeoJsonGeometry geometry;

    private GeoJsonGeometry displayPoint;

    private Integer featureId;

    private Integer sectionCategoryId;

    private Integer restrictionCateId;

    private Integer levelId;
}

package com.example.backend_imdf_ctu.dto.response;

import com.example.backend_imdf_ctu.dto.request.GeoJsonGeometry;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SectionResponse {
    private Integer id;
    private UUID sectionId;
    private String sectionName;

    private GeoJsonGeometry geometry;
    private GeoJsonGeometry displayPoint;

    private Integer featureId;
    private String featureType;

    private Integer sectionCategoryId;
    private String sectionCategoryName;

    private Integer restrictionCateId;
    private String restrictionCateName;

    private Integer levelId;
    private Integer ordinal;
}

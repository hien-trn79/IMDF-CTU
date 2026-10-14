package com.example.backend_imdf_ctu.dto.response;

import com.example.backend_imdf_ctu.dto.request.GeoJsonGeometry;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UnitResponse {
    private Integer id;

    private String unitId;

    private String unitName;

    private GeoJsonGeometry geometry;

    private GeoJsonGeometry displayPoint;

    private LocalDateTime createdAt;

    private Integer featureId;
    private String featureType;

    private Integer levelId;
    private Integer ordinal;

    private Integer unitCategoryId;
    private String unitCategoryName;

    private Integer restrictionCategoryId;
    private String restrictionCategoryName;
}

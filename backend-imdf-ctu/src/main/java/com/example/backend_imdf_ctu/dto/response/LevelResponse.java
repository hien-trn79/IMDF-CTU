package com.example.backend_imdf_ctu.dto.response;

import com.example.backend_imdf_ctu.dto.request.GeoJsonGeometry;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LevelResponse {
    private Integer id;

    private UUID levelId;

    private GeoJsonGeometry geometry;

    private Boolean outdoor;

    private Integer ordinal;

    private GeoJsonGeometry displayPoint;

    private Integer levelCategoryId;
    private String levelCategoryName;
}

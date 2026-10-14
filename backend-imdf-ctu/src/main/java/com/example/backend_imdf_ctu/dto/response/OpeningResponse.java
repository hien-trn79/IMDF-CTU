package com.example.backend_imdf_ctu.dto.response;

import com.example.backend_imdf_ctu.dto.request.GeoJsonGeometry;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OpeningResponse {
    private Integer id;

    private UUID openingId;

    private String openingName;

    private GeoJsonGeometry geometry;

    private GeoJsonGeometry displayPoint;

    private Integer unitId;
    private String unitName;

    private Integer level;

    private Integer openingCategoryId;
    private String openingCategoryName;
}

package com.example.backend_imdf_ctu.dto.response;

import com.example.backend_imdf_ctu.dto.request.GeoJsonGeometry;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnchorResponse {
    private Integer id;

    private String anchorId;

    private String anchorName;

    private GeoJsonGeometry geometry;

    private LocalDateTime createAt;

    private Integer featureId;

    private String featureType;

    private Integer unitId;

    private String unitName;

    private Integer level;
}

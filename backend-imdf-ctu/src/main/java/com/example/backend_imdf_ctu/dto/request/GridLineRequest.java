package com.example.backend_imdf_ctu.dto.request;

import com.example.backend_imdf_ctu.enums.TopologyCategory;
import jakarta.persistence.Column;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.locationtech.jts.geom.LineString;

import java.util.UUID;

@Data
public class GridLineRequest {

    private TopologyCategory category;

    private Boolean isOneWay;

    @NotNull(message = "geom cannot be null")
    private GeoJsonGeometry geometry;

    @NotNull(message = "indoorRouteId cannot be null")
    private Integer indoorRouteId;
}

package com.example.backend_imdf_ctu.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.locationtech.jts.geom.LineString;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GridLineResponse {

    private UUID gridLineId;

    private Integer id;

    private String category;

    private Boolean isOneWay;

    private String geom;

    private Integer indoorRouteId;

    private String indoorRouteName;
}

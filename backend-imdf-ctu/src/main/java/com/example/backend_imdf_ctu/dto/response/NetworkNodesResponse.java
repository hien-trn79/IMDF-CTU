package com.example.backend_imdf_ctu.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class NetworkNodesResponse {

    private Integer id;

    private Boolean isConnector;

    private String geom;

    private Integer indoorRouteId;

    private String indoorRouteName;
}

package com.example.backend_imdf_ctu.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NetworkEdgesResponse {

private Integer id;

    private Integer source;

    private Integer target;

    private Double cost;

    private Double reverseCost;

    private String geometry; // Assuming geometry is represented as a WKT string

    private Integer indoorRouteId;

    private String indoorRouteName; // Assuming you want to include the name of the indoor route
}

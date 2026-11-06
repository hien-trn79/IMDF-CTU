package com.example.backend_imdf_ctu.dto.response;

import lombok.*;

import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IndoorRouteResponse {

    private Integer id;

    private UUID indoorRouteId;

    private String indoorRouteName;

    private String indoorRouteType;

    private String status;

    private Integer levelId;
    private Integer ordinal;
}

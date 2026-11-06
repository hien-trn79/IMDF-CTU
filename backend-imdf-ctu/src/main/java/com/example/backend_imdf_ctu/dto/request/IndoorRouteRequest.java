package com.example.backend_imdf_ctu.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class IndoorRouteRequest {

    private String indoorRouteName;

    private String indoorRouteType;

    private String status;

    private Integer levelId;
}

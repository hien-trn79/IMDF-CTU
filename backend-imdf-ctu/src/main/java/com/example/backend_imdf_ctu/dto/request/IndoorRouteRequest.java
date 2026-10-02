package com.example.backend_imdf_ctu.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class IndoorRouteRequest {

    @NotBlank(message = "Indoor route name is required")
    private String indoorRouteName;

    @NotBlank(message = "Indoor route type is required")
    private String indoorRouteType;

    @NotBlank(message = "Status is required")
    private String status;
}

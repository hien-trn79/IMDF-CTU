package com.example.backend_imdf_ctu.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RelationShipResponse {
    private Integer id;

    private UUID relationShipId;

    private String direction;

    private LocalDateTime hours;

    private Integer featureId;
    private String featureType;

    private Integer relationShipCategoryId;
    private String relationShipCategoryName;
}

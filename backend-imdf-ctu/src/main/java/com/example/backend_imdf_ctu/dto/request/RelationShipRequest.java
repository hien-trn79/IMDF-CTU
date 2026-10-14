package com.example.backend_imdf_ctu.dto.request;

import com.example.backend_imdf_ctu.enums.Direction;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class RelationShipRequest {
    private Direction direction;

    private LocalDateTime hours;

    private Integer featureId;

    private Integer relationShipCategoryId;
}

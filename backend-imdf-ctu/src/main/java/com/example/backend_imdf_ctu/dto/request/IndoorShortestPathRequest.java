package com.example.backend_imdf_ctu.dto.request;

import com.example.backend_imdf_ctu.enums.LocationType;
import lombok.Data;

@Data
public class IndoorShortestPathRequest {
    private Integer sourceNodeId;
    private LocationType sourceLocationType;

    private Integer targetNodeId;
    private LocationType targetLocationType;

    private Integer sourceLevelId;

    private Integer targetLevelId;

    private Boolean isOutdoorIncluded;
}

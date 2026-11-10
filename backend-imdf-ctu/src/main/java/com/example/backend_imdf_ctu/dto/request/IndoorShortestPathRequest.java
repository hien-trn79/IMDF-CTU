package com.example.backend_imdf_ctu.dto.request;

import lombok.Data;

@Data
public class IndoorShortestPathRequest {
    private Integer sourceAnchorId;
    private Integer targetAnchorId;
    private Integer sourceLevelId;
    private Integer targetLevelId;
    private Boolean isOutdoorIncluded;
}

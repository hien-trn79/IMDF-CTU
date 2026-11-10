package com.example.backend_imdf_ctu.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class IndoorPathSegmentResponse {
    private Integer levelId;
    private Integer ordinal;
    private List<double[]> coordinates;
    private String segmentType;
    private Integer stairNodeId;
    private double[] stairCoord;
    private Integer targetFloorOrdinal;
}

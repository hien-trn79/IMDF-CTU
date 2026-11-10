package com.example.backend_imdf_ctu.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class IndoorShortestPathResponse {
    private List<IndoorPathSegmentResponse> segments;
    private double totalDistanceMeters;
    private long estimatedTimeSeconds;
    private boolean found;
    private String message;
    private Integer sourceLevelId;
    private Integer targetLevelId;
}

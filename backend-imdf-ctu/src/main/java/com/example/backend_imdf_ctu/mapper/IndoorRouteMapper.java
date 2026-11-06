package com.example.backend_imdf_ctu.mapper;

import com.example.backend_imdf_ctu.dto.request.IndoorRouteRequest;
import com.example.backend_imdf_ctu.dto.response.IndoorRouteResponse;
import com.example.backend_imdf_ctu.entity.IndoorRoute;
import com.example.backend_imdf_ctu.entity.Level;
import org.springframework.stereotype.Component;

@Component
public class IndoorRouteMapper {

    public IndoorRoute toEntity(
        IndoorRouteRequest request,
        Level level
    ) {
        return IndoorRoute.builder()
            .indoorRouteName(request.getIndoorRouteName())
            .indoorRouteType(request.getIndoorRouteType())
            .status(request.getStatus())
            .level(level)
            .build();
    }

    public IndoorRouteResponse toResponse(IndoorRoute indoorRoute) {
        return IndoorRouteResponse.builder()
            .id(indoorRoute.getId())
            .indoorRouteId(indoorRoute.getIndoorRouteId())
            .indoorRouteName(indoorRoute.getIndoorRouteName())
            .indoorRouteType(indoorRoute.getIndoorRouteType())
            .status(indoorRoute.getStatus())
            .levelId(indoorRoute.getLevel().getId())
            .ordinal(indoorRoute.getLevel().getOrdinal())
            .build();
    }

    public void updateEntity(
        IndoorRoute indoorRoute,
        IndoorRouteRequest request,
        Level level
    ) {
        indoorRoute.setIndoorRouteName(request.getIndoorRouteName());
        indoorRoute.setIndoorRouteType(request.getIndoorRouteType());
        indoorRoute.setStatus(request.getStatus());
    }
}

package com.example.backend_imdf_ctu.mapper;

import com.example.backend_imdf_ctu.dto.request.GridLineRequest;
import com.example.backend_imdf_ctu.entity.GridLine;
import com.example.backend_imdf_ctu.entity.IndoorRoute;
import org.locationtech.jts.geom.Geometry;
import org.locationtech.jts.geom.LineString;
import org.springframework.stereotype.Component;

@Component
public class GridLineMapper {

    private final GeometryConverter geometryConverter;

    public GridLineMapper(GeometryConverter geometryConverter) {
        this.geometryConverter = geometryConverter;
    }

    public GridLine toEntity(GridLineRequest request, IndoorRoute indoorRoute) {
        GridLine gridLine = new GridLine();

        gridLine.setCategory(request.getCategory());
        gridLine.setIsOneWay(request.getIsOneWay());

        Geometry g = geometryConverter.toJts(request.getGeometry());
        if (!(g instanceof LineString lineString)) {
            throw new IllegalArgumentException("Geometry chi chap nhan LineString");
        }
        if (lineString.isEmpty()) {
            throw new IllegalArgumentException("LineString khong duoc rong");
        }
        gridLine.setGeometry(lineString);

        gridLine.setIndoorRoute(indoorRoute);

        return gridLine;
    }

    public void updateEntity(GridLine entity, GridLineRequest request, IndoorRoute indoorRoute) {
        entity.setCategory(request.getCategory());
        entity.setIsOneWay(request.getIsOneWay());

        Geometry g = geometryConverter.toJts(request.getGeometry());
        if (!(g instanceof LineString lineString)) {
            throw new IllegalArgumentException("Geometry chi chap nhan LineString");
        }
        if (lineString.isEmpty()) {
            throw new IllegalArgumentException("LineString khong duoc rong");
        }

        entity.setGeometry(lineString);
        entity.setIndoorRoute(indoorRoute); // Giữ nguyên indoorRouteId
    }
}

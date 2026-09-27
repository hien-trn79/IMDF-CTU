package com.example.backend_imdf_ctu.mapper;

import com.example.backend_imdf_ctu.dto.request.GridLineRequest;
import com.example.backend_imdf_ctu.dto.response.GridLineResponse;
import com.example.backend_imdf_ctu.dto.response.IndoorRouteResponse;
import com.example.backend_imdf_ctu.entity.GridLine;
import com.example.backend_imdf_ctu.entity.IndoorRoute;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.LineString;
import org.locationtech.jts.geom.PrecisionModel;
import org.locationtech.jts.io.WKBReader;
import org.locationtech.jts.io.WKBWriter;
import org.springframework.stereotype.Component;

@Component
public class GridLineMapper {

    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
    private final WKBReader wkbReader = new WKBReader(geometryFactory);
    private final WKBWriter wkbWriter = new WKBWriter();

    public GridLine toEntity(GridLineRequest request) {
        GridLine gridLine = new GridLine();

        gridLine.setCategory(request.getCategory());
        gridLine.setIsOneWay(request.getIsOneWay());

        // Convert chuỗi Hex String sang JTS LineString
        LineString lineString;
        try {
            byte[] bytes = WKBReader.hexToBytes(request.getGeom());
            lineString = (LineString) wkbReader.read(bytes);
            lineString.setSRID(4326); // Đảm bảo SRID là 4326
            gridLine.setGeom(lineString);
        } catch (Exception e) {
            throw new IllegalArgumentException("Định dạng geom WKB Hex không hợp lệ: " + e.getMessage());
        }

        return gridLine;
    }

    public GridLineResponse toResponse(GridLine entity) {
        GridLineResponse response = new GridLineResponse();
        response.setGridLineId(entity.getGridLineId());
        response.setId(entity.getId());
        response.setCategory(entity.getCategory());
        response.setIsOneWay(entity.getIsOneWay());

        // Chuyển LineString sang Hex String
        if (entity.getGeom() != null) {
            byte[] wkb = wkbWriter.write(entity.getGeom());
            response.setGeom(WKBWriter.toHex(wkb));
        }

        if (entity.getIndoorRoute() != null) {
            response.setIndoorRouteId(entity.getIndoorRoute().getId());
            response.setIndoorRouteName(entity.getIndoorRoute().getIndoorRouteName());
        }

        return response;
    }

    public GridLineResponse updateEntity(GridLine entity, GridLineRequest request) {
        entity.setCategory(request.getCategory());
        entity.setIsOneWay(request.getIsOneWay());

        // Convert chuỗi Hex String sang JTS LineString
        LineString lineString;
        try {
            byte[] bytes = WKBReader.hexToBytes(request.getGeom());
            lineString = (LineString) wkbReader.read(bytes);
            lineString.setSRID(4326); // Đảm bảo SRID là 4326
        } catch (Exception e) {
            throw new IllegalArgumentException("Định dạng geom WKB Hex không hợp lệ: " + e.getMessage());
        }

        entity.setGeom(lineString);
        entity.setIndoorRoute(entity.getIndoorRoute()); // Giữ nguyên indoorRouteId

        return toResponse(entity);
    }
}

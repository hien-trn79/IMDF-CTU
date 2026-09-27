package com.example.backend_imdf_ctu.mapper;

import com.example.backend_imdf_ctu.dto.request.NetworkNodesRequest;
import com.example.backend_imdf_ctu.dto.response.NetworkNodesResponse;
import com.example.backend_imdf_ctu.entity.IndoorRoute;
import com.example.backend_imdf_ctu.entity.NetworkNodes;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.io.WKBReader;
import org.locationtech.jts.io.WKBWriter;
import org.springframework.stereotype.Component;

@Component
public class NetworkNodesMapper {

    private final GeometryFactory geometryFactory = new GeometryFactory();
    private final WKBReader wkbReader = new WKBReader(geometryFactory);
    private final WKBWriter wkbWriter = new WKBWriter();

    public NetworkNodes toEntity(
        NetworkNodesRequest request,
        IndoorRoute indoorRoute
    ) {
        NetworkNodes entity = new NetworkNodes();

        entity.setIndoorRoute(indoorRoute);
        entity.setIsConnector(request.getIsConnector());

        // Convert chuoi Hex String sang JTS Point
        Point pointGeometry;
        try {
            byte[] bytes = WKBReader.hexToBytes(request.getGeom());
            pointGeometry = (Point) wkbReader.read(bytes);

            // Set entity cho Point geometry
            entity.setGeom(pointGeometry);

        } catch (Exception e) {
            throw new IllegalArgumentException("Định dạng geom WKB Hex không hợp lệ: " + e.getMessage());
        }
        return entity;
    }

    public NetworkNodesResponse toResponse(NetworkNodes entity) {
        NetworkNodesResponse response = new NetworkNodesResponse();

        response.setId(entity.getId());
        response.setIsConnector(entity.getIsConnector());
        response.setIndoorRouteId(entity.getIndoorRoute().getId());
        response.setIndoorRouteName(
            entity.getIndoorRoute()
                .getIndoorRouteName()
        );

        // Chuyển Point sang Hex String
        if (entity.getGeom() != null) {
            byte[] wkb = wkbWriter.write(entity.getGeom());
            response.setGeom(WKBWriter.toHex(wkb));
        }
        return response;
    }

    public void updateEntity(
        NetworkNodes entity,
        NetworkNodesRequest request,
        IndoorRoute indoorRoute
    ) {
        entity.setIsConnector(request.getIsConnector());

        // Convert chuoi Hex String sang JTS Point
        Point pointGeometry;
        try {
            byte[] bytes = WKBReader.hexToBytes(request.getGeom());
            pointGeometry = (Point) wkbReader.read(bytes);
            entity.setGeom(pointGeometry);
        } catch (Exception e) {
            throw new IllegalArgumentException("Định dạng geom WKB Hex không hợp lệ: " + e.getMessage());
        }

        entity.setIndoorRoute(indoorRoute);
    }
}

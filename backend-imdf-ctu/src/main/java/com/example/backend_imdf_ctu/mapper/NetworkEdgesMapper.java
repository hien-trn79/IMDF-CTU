package com.example.backend_imdf_ctu.mapper;

import com.example.backend_imdf_ctu.dto.request.NetworkEdgesRequest;
import com.example.backend_imdf_ctu.dto.response.NetworkEdgesResponse;
import com.example.backend_imdf_ctu.entity.IndoorRoute;
import com.example.backend_imdf_ctu.entity.NetworkEdges;
import com.example.backend_imdf_ctu.entity.NetworkNodes;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.LineString;
import org.locationtech.jts.geom.PrecisionModel;
import org.locationtech.jts.io.WKBReader;
import org.locationtech.jts.io.WKBWriter;
import org.springframework.stereotype.Component;

@Component
public class NetworkEdgesMapper {

    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
    private final WKBReader wkbReader = new WKBReader(geometryFactory);
    private final WKBWriter wkbWriter = new WKBWriter();

    public NetworkEdgesResponse toResponse(NetworkEdges entity) {
        NetworkEdgesResponse response = new NetworkEdgesResponse();

        response.setId(entity.getId());
        response.setSource(entity.getSource().getId());
        response.setTarget(entity.getTarget().getId());
        response.setCost(entity.getCost());
        response.setReverseCost(entity.getReverseCost());

        // Convert LineString to WKT string
        if (entity.getGeometry() != null) {
            byte[] wkb = wkbWriter.write(entity.getGeometry());
            response.setGeometry(WKBWriter.toHex(wkb));
        }

        if (entity.getIndoorRoute() != null) {
            response.setIndoorRouteId(entity.getIndoorRoute().getId());
            response.setIndoorRouteName(entity.getIndoorRoute().getIndoorRouteName());
        }

        return response;
    }

    public NetworkEdges toEntity(
        NetworkEdgesRequest request,
        IndoorRoute indoorRoute,
        NetworkNodes sourceNode,
        NetworkNodes targetNode
    ) {
        NetworkEdges entity = new NetworkEdges();

        entity.setSource(sourceNode);
        entity.setTarget(targetNode);
        entity.setCost(request.getCost());
        entity.setReverseCost(request.getReverseCost());

        // Convert chuoi WKT string to JTS LineString
        LineString lineString;
        try {
            byte[] bytes = WKBReader.hexToBytes(request.getGeometry());
            lineString = (LineString) wkbReader.read(bytes);
            lineString.setSRID(4326); // Ensure SRID is 4326
            entity.setGeometry(lineString);
        } catch (Exception e) {
            throw new IllegalArgumentException("Định dạng geometry không hợp lệ: " + e.getMessage());
        }

        entity.setIndoorRoute(indoorRoute);

        return entity;
    }

    public void updateEntity(
        NetworkEdges entity,
        NetworkEdgesRequest request,
        IndoorRoute indoorRoute,
        NetworkNodes sourceNode,
        NetworkNodes targetNode
    ) {
        entity.setSource(sourceNode);
        entity.setTarget(targetNode);
        entity.setCost(request.getCost());
        entity.setReverseCost(request.getReverseCost());

        // Convert chuoi WKT string to JTS LineString
        LineString lineString;
        try {
            byte[] bytes = WKBReader.hexToBytes(request.getGeometry());
            lineString = (LineString) wkbReader.read(bytes);
            lineString.setSRID(4326); // Ensure SRID is 4326

            entity.setGeometry(lineString);
        } catch (Exception e) {
            throw new IllegalArgumentException("Định dạng geometry không hợp lệ: " + e.getMessage());
        }

        entity.setIndoorRoute(indoorRoute);
    }
}



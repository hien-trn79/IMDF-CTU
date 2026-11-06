package com.example.backend_imdf_ctu.mapper;

import com.example.backend_imdf_ctu.dto.request.NetworkEdgesRequest;
import com.example.backend_imdf_ctu.entity.IndoorRoute;
import com.example.backend_imdf_ctu.entity.NetworkEdges;
import com.example.backend_imdf_ctu.entity.NetworkNodes;
import org.locationtech.jts.geom.Geometry;
import org.locationtech.jts.geom.LineString;
import org.springframework.stereotype.Component;

@Component
public class NetworkEdgesMapper {

    private final GeometryConverter geometryConverter;

    public NetworkEdgesMapper(GeometryConverter geometryConverter) {
        this.geometryConverter = geometryConverter;
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

        Geometry g = geometryConverter.toJts(request.getGeometry());
        if (!(g instanceof  LineString lineString)) {
            throw new IllegalArgumentException("Định dạng geometry không hợp lệ: Geometry phải là LineString");
        }

        entity.setGeometry(lineString);

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

        Geometry g = geometryConverter.toJts(request.getGeometry());
        if (!(g instanceof  LineString lineString)) {
            throw new IllegalArgumentException("Định dạng geometry không hợp lệ: Geometry phải là LineString");
        }

        entity.setGeometry(lineString);

        entity.setIndoorRoute(indoorRoute);
    }
}



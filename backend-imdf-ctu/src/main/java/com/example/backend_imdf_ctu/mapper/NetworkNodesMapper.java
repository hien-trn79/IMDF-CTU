package com.example.backend_imdf_ctu.mapper;

import com.example.backend_imdf_ctu.dto.request.NetworkNodesRequest;
import com.example.backend_imdf_ctu.entity.IndoorRoute;
import com.example.backend_imdf_ctu.entity.NetworkNodes;
import org.locationtech.jts.geom.Geometry;
import org.locationtech.jts.geom.Point;
import org.springframework.stereotype.Component;

@Component
public class NetworkNodesMapper {

    private final GeometryConverter geometryConverter;

    public NetworkNodesMapper(GeometryConverter geometryConverter) {
        this.geometryConverter = geometryConverter;
    }

    public NetworkNodes toEntity(
        NetworkNodesRequest request,
        IndoorRoute indoorRoute
    ) {
        NetworkNodes entity = new NetworkNodes();

        entity.setIndoorRoute(indoorRoute);
        entity.setIsConnector(request.getIsConnector());

        Geometry g = geometryConverter.toJts(request.getGeometry());

        if(!(g instanceof Point point))
            throw new IllegalArgumentException("Geometry must be a Point");

        entity.setGeometry(point);

        return entity;
    }

    public void updateEntity(
        NetworkNodes entity,
        NetworkNodesRequest request,
        IndoorRoute indoorRoute
    ) {
        entity.setIsConnector(request.getIsConnector());

        // Convert GeoJSON geometry to JTS geometry
        Geometry g = geometryConverter.toJts(request.getGeometry());
        if(!(g instanceof Point point))
            throw new IllegalArgumentException("Geometry must be a Point");

        entity.setGeometry(point);

        entity.setIndoorRoute(indoorRoute);
    }
}

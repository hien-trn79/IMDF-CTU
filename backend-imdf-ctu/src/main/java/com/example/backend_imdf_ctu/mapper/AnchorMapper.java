package com.example.backend_imdf_ctu.mapper;

import com.example.backend_imdf_ctu.dto.request.AnchorRequest;
import com.example.backend_imdf_ctu.entity.Anchor;
import com.example.backend_imdf_ctu.entity.Feature;
import com.example.backend_imdf_ctu.entity.Unit;
import com.example.backend_imdf_ctu.exception.InvalidGeometryException;
import org.locationtech.jts.geom.Geometry;
import org.locationtech.jts.geom.Point;
import org.springframework.stereotype.Component;

@Component
public class AnchorMapper {

    private final GeometryConverter geometryConverter;

    public AnchorMapper(GeometryConverter geometryConverter) {
        this.geometryConverter = geometryConverter;
    }

    public Anchor toEntity(
        AnchorRequest request,
        Feature feature,
        Unit unit
    ) {
        Anchor entity = new Anchor();

        entity.setFeature(feature);
        entity.setUnit(unit);

        entity.setAnchorName(request.getAnchorName());

        Geometry g = geometryConverter.toJts(request.getGeometry());
        if (!(g instanceof Point point)) {
            throw new InvalidGeometryException(
                "Anchor chỉ chấp nhận Point, nhận được: " + g.getGeometryType());
        }
        if (Math.abs(point.getX()) > 180 || Math.abs(point.getY()) > 90) {
            throw new InvalidGeometryException("Tọa độ ngoài phạm vi WGS84 (kiểm tra thứ tự kinh độ, vĩ độ)");
        }
        entity.setGeometry(point);

        return entity;
    }

    public void update(
        Anchor entity,
        AnchorRequest request,
        Feature feature,
        Unit unit
    ) {
        entity.setFeature(feature);
        entity.setUnit(unit);

        entity.setAnchorName(request.getAnchorName());

        Geometry g = geometryConverter.toJts(request.getGeometry());
        if (!(g instanceof Point point)) {
            throw new InvalidGeometryException(
                "Anchor chỉ chấp nhận Point, nhận được: " + g.getGeometryType());
        }
        if (Math.abs(point.getX()) > 180 || Math.abs(point.getY()) > 90) {
            throw new InvalidGeometryException("Tọa độ ngoài phạm vi WGS84 (kiểm tra thứ tự kinh độ, vĩ độ)");
        }
        entity.setGeometry(point);
    }
}

package com.example.backend_imdf_ctu.mapper;

import com.example.backend_imdf_ctu.dto.request.OpeningRequest;
import com.example.backend_imdf_ctu.dto.response.OpeningResponse;
import com.example.backend_imdf_ctu.entity.Opening;
import com.example.backend_imdf_ctu.entity.OpeningCategory;
import com.example.backend_imdf_ctu.entity.Unit;
import com.example.backend_imdf_ctu.exception.BusinessException;
import com.example.backend_imdf_ctu.exception.ErrorCode;
import com.example.backend_imdf_ctu.exception.InvalidGeometryException;
import org.locationtech.jts.geom.Envelope;
import org.locationtech.jts.geom.Geometry;
import org.locationtech.jts.geom.LineString;
import org.locationtech.jts.geom.Point;
import org.springframework.stereotype.Component;

@Component
public class OpeningMapper {

    private final GeometryConverter geometryConverter;

    public OpeningMapper(GeometryConverter geometryConverter) {
        this.geometryConverter = geometryConverter;
    }

    public OpeningResponse toResponse(Opening entity) {
        OpeningResponse response = new OpeningResponse();

        response.setId(entity.getId());
        response.setOpeningId(entity.getOpeningId());
        response.setOpeningName(entity.getOpeningName());

        response.setUnitId(entity.getUnit().getId());
        response.setUnitName(entity.getUnit().getUnitName());
        response.setLevel(entity.getUnit().getLevel().getOrdinal());

        response.setGeometry(geometryConverter.toGeoJson(entity.getGeometry()));
        response.setDisplayPoint(geometryConverter.toGeoJson(entity.getDisplayPoint()));

        response.setOpeningCategoryId(entity.getOpeningCategory().getId());
        response.setOpeningCategoryName(entity.getOpeningCategory().getOpeningCategoryName());

        return response;
    }

    public Opening toEntity(
        OpeningRequest request,
        Unit unit,
        OpeningCategory openingCategory
    ) {
        Opening entity = new Opening();

        entity.setOpeningName(request.getOpeningName());

        applyGeometry(entity, request);

        entity.setUnit(unit);
        entity.setOpeningCategory(openingCategory);

        return entity;
    }

    public void update(
        Opening entity,
        OpeningRequest request,
        Unit unit,
        OpeningCategory openingCategory
    ) {
        entity.setOpeningName(request.getOpeningName());

        entity.setUnit(unit);
        entity.setOpeningCategory(openingCategory);

        applyGeometry(entity, request);
    }

    // ======== private ========
    private static final int SRID = 4326;

    private void applyGeometry(Opening entity, OpeningRequest request) {
        Geometry g = geometryConverter.toJts(request.getGeometry());

        if (g == null || g.isEmpty()) {
            throw new BusinessException(ErrorCode.INVALID_GEOMETRY, "Geometry không được null hoặc rỗng");
        }
        if (!(g instanceof LineString line)) {
            throw new BusinessException(ErrorCode.INVALID_GEOMETRY,
                "Geometry của Opening phải là LineString, nhận được: " + g.getGeometryType());
        }
        if (line.getNumPoints() < 2 || line.getLength() == 0) {
            throw new BusinessException(ErrorCode.INVALID_GEOMETRY, "LineString phải có ít nhất 2 điểm và chiều dài > 0");
        }
        validateWgs84(line);
        line.setSRID(SRID);
        entity.setGeometry(line);

        Point point;
        if (request.getDisplayPoint() != null) {
            Geometry dp = geometryConverter.toJts(request.getDisplayPoint());
            if (!(dp instanceof Point p)) {
                throw new BusinessException(ErrorCode.INVALID_GEOMETRY,
                    "DisplayPoint chỉ chấp nhận Point, nhận được: "
                        + (dp == null ? "null" : dp.getGeometryType()));
            }
            validateWgs84(p);
            point = p;
        } else {
            point = line.getInteriorPoint();
        }
        point.setSRID(SRID);
        entity.setDisplayPoint(point);
    }

    private void validateWgs84(Geometry geometry) {
        Envelope env = geometry.getEnvelopeInternal();
        if (env.getMinX() < -180 || env.getMaxX() > 180
            || env.getMinY() < -90 || env.getMaxY() > 90) {
            throw new InvalidGeometryException(
                "Tọa độ ngoài phạm vi WGS84 (kiểm tra thứ tự kinh độ, vĩ độ)");
        }
    }
}
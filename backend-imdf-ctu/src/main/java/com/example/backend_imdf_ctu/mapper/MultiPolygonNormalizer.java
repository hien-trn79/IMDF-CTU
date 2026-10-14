package com.example.backend_imdf_ctu.mapper;

import com.example.backend_imdf_ctu.exception.InvalidGeometryException;
import org.locationtech.jts.geom.*;
import org.springframework.stereotype.Component;

import org.locationtech.jts.operation.valid.IsValidOp;


@Component
public class MultiPolygonNormalizer {

    private static final int SRID = 4326; // WGS 84
    private final GeometryFactory factory = new GeometryFactory(
        new PrecisionModel(), SRID
    );

    public MultiPolygon normalize(Geometry input) {
         if (input == null || input.isEmpty()) {
             throw new InvalidGeometryException("Hình học đưa vào không được để rỗng hoặc null");
         }

         MultiPolygon result;
         if (input instanceof MultiPolygon multiPolygon) {
             return result = multiPolygon;
         } else if (input instanceof Polygon polygon) {
             result = factory.createMultiPolygon(new Polygon[] {polygon});
         } else {
             throw new InvalidGeometryException("Hình học đưa vào phải là MultiPolygon hoặc Polygon");
         }

         result.setSRID(SRID);

         Envelope env = result.getEnvelopeInternal();
        if (env.getMinX() < -180 || env.getMaxX() > 180 || env.getMinY() < -90 || env.getMaxY() > 90) {
            throw new InvalidGeometryException("Tọa độ ngoài phạm vi WGS84 (kiểm tra thứ tự kinh độ, vĩ độ)");
        }

        IsValidOp op = new IsValidOp(result);
        if (!op.isValid()) {
            throw new InvalidGeometryException("Hình học không hợp lệ: " + op.getValidationError().getMessage());
        }

         return result;
    }
}

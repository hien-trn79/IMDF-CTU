package com.example.backend_imdf_ctu.mapper;

import com.example.backend_imdf_ctu.dto.request.AmenityRequest;
import com.example.backend_imdf_ctu.dto.response.AmenityResponse;
import com.example.backend_imdf_ctu.entity.Amenity;
import com.example.backend_imdf_ctu.entity.AmenityCategory;
import com.example.backend_imdf_ctu.entity.Feature;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.io.WKBReader;
import org.locationtech.jts.io.WKBWriter;
import org.springframework.stereotype.Component;


@Component
public class AmenityMapper {

    private final GeometryFactory geometryFactory = new GeometryFactory();
    private final WKBReader wkbReader = new WKBReader(geometryFactory);
    private final WKBWriter wkbWriter = new WKBWriter();

    public AmenityResponse toResponse(
        Amenity entity) {
         AmenityResponse response = new AmenityResponse();

         response.setId(entity.getId());
         response.setAmenityId(entity.getAmenityId().toString());

         // Chuyen Point sang WKT String
         if (entity.getGeometry() != null) {
             // Chuyen Geometry sang WKB
             byte[] wkb = wkbWriter.write(entity.getGeometry());
             response.setGeometry(WKBWriter.toHex(wkb));
         }

         response.setHours(entity.getHours());
         response.setPhone(entity.getPhone());
         response.setWebsite(entity.getWebsite());
         response.setCorrelationId(entity.getCorrelationId().toString());

         response.setAmenityCategoryId(entity.getAmenityCategory().getId());
         response.setFeatureId(entity.getFeature().getId());
         return response;
    }

    public Amenity toEntity(
        AmenityRequest request,
        AmenityCategory amenityCategory,
        Feature feature
    ) {
        Amenity entity = new Amenity();

        entity.setAmenityId(java.util.UUID.randomUUID());
        entity.setCorrelationId(java.util.UUID.randomUUID());

        // Chuyen WKT String sang Point
        Point pointGeometry;
        if (request.getGeometry() != null) {
            try {
                byte[] bytes = WKBReader.hexToBytes(request.getGeometry());
                pointGeometry = (Point) wkbReader.read(bytes);
                entity.setGeometry(pointGeometry);
            } catch (Exception e) {
                throw new IllegalArgumentException("Định dạng geometry WKT không hợp lệ: " + e.getMessage());
            }
        }

        entity.setHours(request.getHours());
        entity.setPhone(request.getPhone());
        entity.setWebsite(request.getWebsite());

        entity.setAmenityCategory(amenityCategory);
        entity.setFeature(feature);

        return entity;
    }
}

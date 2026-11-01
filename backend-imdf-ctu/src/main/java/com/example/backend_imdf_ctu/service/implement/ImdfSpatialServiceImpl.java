package com.example.backend_imdf_ctu.service.implement;

import com.example.backend_imdf_ctu.dto.request.GeoJsonGeometry;
import com.example.backend_imdf_ctu.dto.request.ImdfNormalizeRequest;
import com.example.backend_imdf_ctu.dto.response.ImdfNormalizeResponse;
import com.example.backend_imdf_ctu.mapper.GeometryConverter;
import com.example.backend_imdf_ctu.service.interfaces.ImdfSpatialService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.locationtech.jts.geom.*;
import org.locationtech.jts.geom.util.GeometryFixer;
import org.locationtech.jts.operation.valid.IsValidOp;
import org.locationtech.jts.simplify.TopologyPreservingSimplifier;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class ImdfSpatialServiceImpl implements ImdfSpatialService {

    private final GeometryConverter geometryConverter;
    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);

    // Can Tho / CTU Lat ~10.03 deg -> approx conversion factors from degrees to meters
    private static final double METERS_PER_DEG_LAT = 110852.0;
    private static final double METERS_PER_DEG_LNG = 109630.0;

    @Override
    public ImdfNormalizeResponse normalizeAndValidate(ImdfNormalizeRequest request) {
        if (request == null || request.getGeometry() == null) {
            return ImdfNormalizeResponse.builder()
                    .valid(false)
                    .message("Dữ liệu hình học (Geometry) không được để trống")
                    .build();
        }

        try {
            // 1. Chuyển đổi GeoJSON sang JTS Geometry
            Geometry geom = geometryConverter.toJts(request.getGeometry());
            geom.setSRID(4326);

            // 2. Kiểm tra tính hợp lệ hình học & Sửa lỗi tự động (ST_MakeValid tương đương JTS GeometryFixer)
            IsValidOp validOp = new IsValidOp(geom);
            boolean wasValid = validOp.isValid();
            String repairMessage = "Hình học hợp lệ";

            if (!wasValid) {
                log.warn("Geometry không hợp lệ ({}), tiến hành tự động sửa bằng GeometryFixer (ST_MakeValid)",
                        validOp.getValidationError().getMessage());
                geom = GeometryFixer.fix(geom);
                repairMessage = "Đã tự động sửa lỗi topo bằng ST_MakeValid (GeometryFixer)";
            }

            // 3. Đơn giản hóa bảo toàn topo (ST_SimplifyPreserveTopology) nếu có yêu cầu
            if (request.getSimplifyTolerance() != null && request.getSimplifyTolerance() > 0) {
                geom = TopologyPreservingSimplifier.simplify(geom, request.getSimplifyTolerance());
            }

            // 4. Ánh xạ đặc tả chuẩn IMDF theo loại Feature
            String featureType = request.getFeatureType() != null ? request.getFeatureType().toLowerCase().trim() : "unit";
            geom = enforceImdfGeometryType(geom, featureType);

            // 5. Xử lý hoặc tự động tính toán Display Point (Tâm hiển thị nằm trong polygon)
            Point displayPointJts = null;
            if (request.getDisplayPoint() != null) {
                try {
                    Geometry dpCandidate = geometryConverter.toJts(request.getDisplayPoint());
                    if (dpCandidate instanceof Point p && geom.covers(p)) {
                        displayPointJts = p;
                    }
                } catch (Exception ignored) {
                }
            }

            if (displayPointJts == null) {
                // Tự động tìm interior point (đảm bảo luôn nằm bên trong khối)
                displayPointJts = geom.getInteriorPoint();
                displayPointJts.setSRID(4326);
            }

            // 6. Tính toán các chỉ số Bounding Box, Diện tích và Chu vi / Độ dài
            Envelope env = geom.getEnvelopeInternal();
            List<Double> bbox = List.of(env.getMinX(), env.getMinY(), env.getMaxX(), env.getMaxY());

            double areaSqm = 0.0;
            double lengthMeters = 0.0;

            if (geom instanceof Polygon || geom instanceof MultiPolygon) {
                areaSqm = calculateAreaSqm(geom);
                lengthMeters = calculatePerimeterMeters(geom);
            } else if (geom instanceof LineString || geom instanceof MultiLineString) {
                lengthMeters = calculateLineLengthMeters(geom);
            }

            // 7. Đồng bộ các thuộc tính IMDF bắt buộc
            Map<String, Object> props = request.getProperties() != null
                    ? new HashMap<>(request.getProperties())
                    : new HashMap<>();

            String featureId = props.containsKey("id") && props.get("id") != null
                    ? String.valueOf(props.get("id"))
                    : UUID.randomUUID().toString();

            props.put("id", featureId);
            props.put("feature_type", featureType);
            props.put("area_sqm", Math.round(areaSqm * 100.0) / 100.0);
            props.put("length_meters", Math.round(lengthMeters * 100.0) / 100.0);
            props.put("vertex_count", geom.getNumPoints());
            props.put("normalized_at", Instant.now().toString());
            props.put("is_valid", true);

            if (!props.containsKey("name") || props.get("name") == null) {
                props.put("name", featureType.toUpperCase() + "_" + featureId.substring(0, Math.min(6, featureId.length())));
            }

            GeoJsonGeometry normalizedGeom = geometryConverter.toGeoJson(geom);
            GeoJsonGeometry displayPointGeom = geometryConverter.toGeoJson(displayPointJts);

            return ImdfNormalizeResponse.builder()
                    .valid(true)
                    .message(repairMessage)
                    .featureType(featureType)
                    .geometry(normalizedGeom)
                    .displayPoint(displayPointGeom)
                    .properties(props)
                    .bbox(bbox)
                    .areaSqm(Math.round(areaSqm * 100.0) / 100.0)
                    .lengthMeters(Math.round(lengthMeters * 100.0) / 100.0)
                    .vertexCount(geom.getNumPoints())
                    .geometryType(geom.getGeometryType())
                    .build();

        } catch (Exception e) {
            log.error("Lỗi khi chuẩn hóa IMDF geometry: {}", e.getMessage(), e);
            return ImdfNormalizeResponse.builder()
                    .valid(false)
                    .message("Lỗi xử lý hình học: " + e.getMessage())
                    .build();
        }
    }

    private Geometry enforceImdfGeometryType(Geometry geom, String featureType) {
        // IMDF quy định Unit, Building, Level, Footprint phải là MultiPolygon
        if (Set.of("unit", "building", "level", "footprint").contains(featureType)) {
            if (geom instanceof Polygon polygon) {
                return geometryFactory.createMultiPolygon(new Polygon[]{polygon});
            } else if (geom instanceof MultiPolygon) {
                return geom;
            } else if (geom instanceof GeometryCollection col) {
                List<Polygon> polys = new ArrayList<>();
                for (int i = 0; i < col.getNumGeometries(); i++) {
                    if (col.getGeometryN(i) instanceof Polygon p) {
                        polys.add(p);
                    }
                }
                if (!polys.isEmpty()) {
                    return geometryFactory.createMultiPolygon(polys.toArray(new Polygon[0]));
                }
            }
        }
        return geom;
    }

    private double calculateAreaSqm(Geometry geom) {
        // Approximate calculation on WGS84 for Can Tho area
        return geom.getArea() * METERS_PER_DEG_LAT * METERS_PER_DEG_LNG;
    }

    private double calculatePerimeterMeters(Geometry geom) {
        double perimeterDegrees = geom.getLength();
        return perimeterDegrees * ((METERS_PER_DEG_LAT + METERS_PER_DEG_LNG) / 2.0);
    }

    private double calculateLineLengthMeters(Geometry geom) {
        double lengthDegrees = geom.getLength();
        return lengthDegrees * ((METERS_PER_DEG_LAT + METERS_PER_DEG_LNG) / 2.0);
    }
}

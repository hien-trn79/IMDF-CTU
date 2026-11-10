package com.example.backend_imdf_ctu.mapper;

import com.example.backend_imdf_ctu.dto.request.GeoJsonGeometry;
import com.example.backend_imdf_ctu.exception.InvalidGeometryException;
import org.geolatte.geom.codec.Wkt;
import org.locationtech.jts.geom.*;
import org.locationtech.jts.io.ParseException;
import org.locationtech.jts.io.WKTReader;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class GeometryConverter {

    private static final int SRID = 4326; // WGS 84
    private final GeometryFactory factory = new GeometryFactory(new PrecisionModel(), SRID);

    //    GEOJSON -> Jts
    public Geometry toJts(GeoJsonGeometry geoJsonGeometry) {
        if (geoJsonGeometry == null || geoJsonGeometry.type() == null || geoJsonGeometry.coordinates() == null) {
            throw new InvalidGeometryException("GeoJsonGeometry không được để rỗng");
        }
        try {
            return switch (geoJsonGeometry.type()) {
                case "Point" -> factory.createPoint(coord(geoJsonGeometry.coordinates()));
                case "LineString" -> factory.createLineString(coords(geoJsonGeometry.coordinates()));
                case "Polygon" -> polygon(geoJsonGeometry.coordinates());
                case "MultiPolygon" -> multiPolygon(geoJsonGeometry.coordinates());
                default -> throw new InvalidGeometryException("Loại geometry không được hỗ trợ: " + geoJsonGeometry.type());
            };
        } catch (ClassCastException | IllegalArgumentException e) {
            throw new InvalidGeometryException("Lỗi khi chuyển đổi geometry: " + e.getMessage());
        }
    }

    private Coordinate coord(List<?> coordinates) {
         if (coordinates.size() < 2) {
             throw new InvalidGeometryException("Điểm phải có ít nhất 2 tọa độ (x, y)");
         }

        double x = ((Number) coordinates.get(0)).doubleValue();
        double y = ((Number) coordinates.get(1)).doubleValue();

        if(!Double.isFinite(x) || !Double.isFinite(y)) {
            throw new InvalidGeometryException("Tọa độ phải là số hữu hạn");
        }
        return new Coordinate(x, y);
    }

    private Coordinate[] coords(List<?> list) {
        return list.stream()
            .map(o -> coord((List<?>) o))
            .toArray(Coordinate[]::new);
    }

    private Polygon polygon(List<?> rings) {
        if (rings.isEmpty()) throw new InvalidGeometryException("Polygon không có vòng nào");
        LinearRing shell = factory.createLinearRing(coords((List<List<?>>) rings.get(0)));
        LinearRing[] holes = rings.stream().skip(1)
            .map(r -> factory.createLinearRing(coords((List<List<?>>) r)))
            .toArray(LinearRing[]::new);
        return factory.createPolygon(shell, holes);
    }

    private MultiPolygon multiPolygon(List<?> polygons) {
        if (polygons.isEmpty()) throw new InvalidGeometryException("MultiPolygon không có polygon nào");
        Polygon[] polys = polygons.stream()
            .map(p -> polygon((List<?>) p))
            .toArray(Polygon[]::new);
        return factory.createMultiPolygon(polys);
    }

//    JTS -> GeoJSON
    public GeoJsonGeometry toGeoJson(Geometry geometry) {
        if (geometry == null || geometry.isEmpty()) return null;
        if(geometry instanceof Point point) return new GeoJsonGeometry("Point", List.of(point.getX(), point.getY()));
        if(geometry instanceof LineString line) return new GeoJsonGeometry("LineString", line(line));
        if(geometry instanceof Polygon polygon) return new GeoJsonGeometry("Polygon", rings(polygon));

        if(geometry instanceof MultiPolygon m) {
            List<Object> polys = new ArrayList<>();
            for (int i = 0; i < m.getNumGeometries(); i++) {
                Polygon p = (Polygon) m.getGeometryN(i);
                polys.add(rings(p));
            }
            return new GeoJsonGeometry("MultiPolygon", polys);
        }
        throw new InvalidGeometryException("Loại geometry không được hỗ trợ: " + geometry.getGeometryType());
    }

    private List<Double> pos (Coordinate coordinate) {
        return List.of(coordinate.getX(), coordinate.getY());
    }

    private List<Object> line(LineString l) {
        List<Object> out = new ArrayList<>();
        for (Coordinate c : l.getCoordinates()) {
            out.add(pos(c));
        }
        return out;
    }

    private List<Object> rings(Polygon p) {
        List<Object> out = new ArrayList<>();
        out.add(line(p.getExteriorRing()));
        for (int i = 0; i < p.getNumInteriorRing(); i++) {
            out.add(line(p.getInteriorRingN(i)));
        }
        return out;
    }

    // Geolatte -> JTS

    public Geometry toJts(org.geolatte.geom.Geometry<?> geometry) {

        if (geometry == null || geometry.isEmpty()) {
            return null;
        }

        try {
            String wkt = Wkt.toWkt(geometry);

            // Loại bỏ phần khai báo SRID nếu có
            if (wkt.startsWith("SRID=")) {
                int separatorIndex = wkt.indexOf(';');

                if (separatorIndex >= 0) {
                    wkt = wkt.substring(separatorIndex + 1);
                }
            }

            WKTReader reader = new WKTReader(factory);

            Geometry result = reader.read(wkt);

            // Giữ SRID từ Geometry gốc
            result.setSRID(geometry.getSRID());

            return result;

        } catch (Exception e) {
            throw new InvalidGeometryException(
                "Không thể chuyển đổi Geolatte sang JTS: "
                    + e.getMessage()
            );
        }
    }

}

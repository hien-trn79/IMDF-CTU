package com.example.backend_imdf_ctu;

import com.example.backend_imdf_ctu.exception.InvalidGeometryException;
import com.example.backend_imdf_ctu.mapper.MultiPolygonNormalizer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.locationtech.jts.geom.*;

import static org.assertj.core.api.AssertionsForClassTypes.assertThat;
import static org.assertj.core.api.AssertionsForClassTypes.assertThatThrownBy;

public class MultiPolygonNormalizerTest {

    private final GeometryFactory factory = new GeometryFactory(new PrecisionModel(), 4326);
    private MultiPolygonNormalizer normalizer;

    @BeforeEach
    void setUp() {
        normalizer = new MultiPolygonNormalizer();
    }

    private Polygon square(double x, double y, double size) {
        return factory.createPolygon(new Coordinate[]{
            new Coordinate(x, y), new Coordinate(x + size, y),
            new Coordinate(x + size, y + size), new Coordinate(x, y + size),
            new Coordinate(x, y)});
    }

    @Test
    @DisplayName("Polygon được chuẩn hóa thành MultiPolygon một phần tử, SRID 4326")
    void polygonBecomesMultiPolygon() {
        MultiPolygon result = normalizer.normalize(square(105.76, 10.03, 0.001));

        assertThat(result.getNumGeometries()).isEqualTo(1);
        assertThat(result.getSRID()).isEqualTo(4326);
    }

    @Test
    @DisplayName("MultiPolygon hai mảnh được giữ nguyên số mảnh")
    void multiPolygonKeepsParts() {
        MultiPolygon input = factory.createMultiPolygon(new Polygon[]{
            square(105.76, 10.03, 0.001), square(105.77, 10.03, 0.001)});

        MultiPolygon result = normalizer.normalize(input);

        assertThat(result.getNumGeometries()).isEqualTo(2);
        assertThat(result.getSRID()).isEqualTo(4326);
    }

    @Test
    @DisplayName("Polygon có lỗ vẫn giữ lỗ sau khi chuẩn hóa")
    void polygonWithHoleKeepsHole() {
        LinearRing shell = factory.createLinearRing(new Coordinate[]{
            new Coordinate(105.00, 10.00), new Coordinate(105.01, 10.00),
            new Coordinate(105.01, 10.01), new Coordinate(105.00, 10.01),
            new Coordinate(105.00, 10.00)});
        LinearRing hole = factory.createLinearRing(new Coordinate[]{
            new Coordinate(105.002, 10.002), new Coordinate(105.004, 10.002),
            new Coordinate(105.004, 10.004), new Coordinate(105.002, 10.004),
            new Coordinate(105.002, 10.002)});

        MultiPolygon result = normalizer.normalize(
            factory.createPolygon(shell, new LinearRing[]{hole}));

        assertThat(((Polygon) result.getGeometryN(0)).getNumInteriorRing()).isEqualTo(1);
    }

    @Test
    @DisplayName("Point bị từ chối")
    void rejectsPoint() {
        assertThatThrownBy(() -> normalizer.normalize(factory.createPoint(new Coordinate(105.76, 10.03))))
            .isInstanceOf(InvalidGeometryException.class);
    }

    @Test
    @DisplayName("LineString bị từ chối")
    void rejectsLineString() {
        LineString line = factory.createLineString(new Coordinate[]{
            new Coordinate(105.76, 10.03), new Coordinate(105.77, 10.04)});

        assertThatThrownBy(() -> normalizer.normalize(line))
            .isInstanceOf(InvalidGeometryException.class);
    }

    @Test
    @DisplayName("null và hình học rỗng bị từ chối")
    void rejectsNullAndEmpty() {
        assertThatThrownBy(() -> normalizer.normalize(null))
            .isInstanceOf(InvalidGeometryException.class);
        assertThatThrownBy(() -> normalizer.normalize(factory.createPolygon()))
            .isInstanceOf(InvalidGeometryException.class);
    }

    @Test
    @DisplayName("Polygon tự cắt nhau (hình nơ) bị từ chối")
    void rejectsSelfIntersectingPolygon() {
        Polygon bowtie = factory.createPolygon(new Coordinate[]{
            new Coordinate(105.0, 10.0), new Coordinate(105.2, 10.2),
            new Coordinate(105.2, 10.0), new Coordinate(105.0, 10.2),
            new Coordinate(105.0, 10.0)});

        assertThatThrownBy(() -> normalizer.normalize(bowtie))
            .isInstanceOf(InvalidGeometryException.class);
    }

    @Test
    @DisplayName("Tọa độ đảo kinh độ và vĩ độ (vĩ độ > 90) bị từ chối")
    void rejectsSwappedLatLon() {
        // Hình hợp lệ nhưng vĩ độ ~105, dấu hiệu nhập đảo thứ tự
        Polygon swapped = square(10.0, 105.0, 0.1);

        assertThatThrownBy(() -> normalizer.normalize(swapped))
            .isInstanceOf(InvalidGeometryException.class);
    }
}

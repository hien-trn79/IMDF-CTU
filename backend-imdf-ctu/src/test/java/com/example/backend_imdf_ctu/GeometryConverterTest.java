package com.example.backend_imdf_ctu;

import com.example.backend_imdf_ctu.dto.request.GeoJsonGeometry;
import com.example.backend_imdf_ctu.exception.InvalidGeometryException;
import com.example.backend_imdf_ctu.mapper.GeometryConverter;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.locationtech.jts.geom.*;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.*;

public class GeometryConverterTest {

    private final GeometryConverter converter = new GeometryConverter();
    private final GeometryFactory factory = new GeometryFactory(new PrecisionModel(), 4326);

    /** Tạo một vòng GeoJSON từ các cặp [kinh độ, vĩ độ]. Luôn dùng double, không dùng int. */
    private static List<Object> ring(double[]... points) {
        List<Object> r = new ArrayList<>();
        for (double[] p : points) r.add(List.of(p[0], p[1]));
        return r;
    }

    private static List<Object> shell() {
        return ring(new double[]{105.00, 10.00}, new double[]{105.01, 10.00},
            new double[]{105.01, 10.01}, new double[]{105.00, 10.01}, new double[]{105.00, 10.00});
    }

    private static List<Object> hole() {
        return ring(new double[]{105.002, 10.002}, new double[]{105.004, 10.002},
            new double[]{105.004, 10.004}, new double[]{105.002, 10.004}, new double[]{105.002, 10.002});
    }

    @Test
    @DisplayName("Point: phần tử đầu là kinh độ (x), phần tử sau là vĩ độ (y)")
    void pointCoordinateOrder() {
        Geometry g = converter.toJts(new GeoJsonGeometry("Point", List.of(105.77, 10.03)));

        assertThat(g).isInstanceOf(Point.class);
        assertThat(((Point) g).getX()).isEqualTo(105.77);
        assertThat(((Point) g).getY()).isEqualTo(10.03);
        assertThat(g.getSRID()).isEqualTo(4326);
    }

    @Test
    @DisplayName("Polygon có lỗ: chuyển đi rồi chuyển lại cho kết quả giống hệt")
    void polygonWithHoleRoundTrip() {
        GeoJsonGeometry original = new GeoJsonGeometry("Polygon", List.of(shell(), hole()));

        Geometry jts = converter.toJts(original);
        assertThat(jts).isInstanceOf(Polygon.class);
        assertThat(((Polygon) jts).getNumInteriorRing()).isEqualTo(1);

        GeoJsonGeometry back = converter.toGeoJson(jts);
        assertThat(back.type()).isEqualTo("Polygon");
        assertThat(back.coordinates()).isEqualTo(original.coordinates());
    }

    @Test
    @DisplayName("MultiPolygon hai mảnh: chuyển đi rồi chuyển lại cho kết quả giống hệt")
    void multiPolygonRoundTrip() {
        List<Object> secondShell = ring(new double[]{105.10, 10.00}, new double[]{105.11, 10.00},
            new double[]{105.11, 10.01}, new double[]{105.10, 10.01}, new double[]{105.10, 10.00});
        GeoJsonGeometry original = new GeoJsonGeometry("MultiPolygon",
            List.of(List.of(shell()), List.of(secondShell)));

        Geometry jts = converter.toJts(original);
        assertThat(jts).isInstanceOf(MultiPolygon.class);
        assertThat(jts.getNumGeometries()).isEqualTo(2);

        assertThat(converter.toGeoJson(jts).coordinates()).isEqualTo(original.coordinates());
    }

    @Test
    @DisplayName("Kiểu hình học chưa hỗ trợ bị từ chối")
    void rejectsUnsupportedType() {
        assertThatThrownBy(() -> converter.toJts(new GeoJsonGeometry("GeometryCollection", List.of())))
            .isInstanceOf(InvalidGeometryException.class);
    }

    @Test
    @DisplayName("Đầu vào null hoặc thiếu coordinates bị từ chối")
    void rejectsNullInput() {
        assertThatThrownBy(() -> converter.toJts(null))
            .isInstanceOf(InvalidGeometryException.class);
        assertThatThrownBy(() -> converter.toJts(new GeoJsonGeometry("Point", null)))
            .isInstanceOf(InvalidGeometryException.class);
    }

    @Test
    @DisplayName("Vòng không khép kín bị từ chối bằng InvalidGeometryException, không phải lỗi 500")
    void rejectsUnclosedRing() {
        List<Object> unclosed = ring(new double[]{105.00, 10.00}, new double[]{105.01, 10.00},
            new double[]{105.01, 10.01}, new double[]{105.00, 10.01});

        assertThatThrownBy(() -> converter.toJts(new GeoJsonGeometry("Polygon", List.of(unclosed))))
            .isInstanceOf(InvalidGeometryException.class);
    }

    @Test
    @DisplayName("Vòng ít hơn 4 điểm bị từ chối")
    void rejectsRingWithTooFewPoints() {
        List<Object> tooShort = ring(new double[]{105.0, 10.0}, new double[]{105.1, 10.1}, new double[]{105.0, 10.0});

        assertThatThrownBy(() -> converter.toJts(new GeoJsonGeometry("Polygon", List.of(tooShort))))
            .isInstanceOf(InvalidGeometryException.class);
    }

    @Test
    @DisplayName("Tọa độ chỉ có một giá trị bị từ chối")
    void rejectsCoordinateWithOneValue() {
        assertThatThrownBy(() -> converter.toJts(new GeoJsonGeometry("Point", List.of(105.0))))
            .isInstanceOf(InvalidGeometryException.class);
    }

    @Test
    @DisplayName("Sai cấp lồng của coordinates bị từ chối thay vì ném ClassCastException")
    void rejectsWrongNesting() {
        // Point nhưng coordinates lại là danh sách của danh sách
        assertThatThrownBy(() -> converter.toJts(
            new GeoJsonGeometry("Point", List.of(List.of(105.0, 10.0)))))
            .isInstanceOf(InvalidGeometryException.class);
    }

    @Test
    @DisplayName("toGeoJson trả null cho null và hình học rỗng")
    void toGeoJsonHandlesNullAndEmpty() {
        assertThat(converter.toGeoJson(null)).isNull();
        assertThat(converter.toGeoJson(factory.createPolygon())).isNull();
    }
}
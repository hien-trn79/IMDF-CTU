package com.example.backend_imdf_ctu.mapper;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.locationtech.jts.io.ByteOrderValues;
import org.locationtech.jts.io.WKBReader;
import org.locationtech.jts.io.WKBWriter;

@Converter(autoApply = false)
public class PointConvert implements AttributeConverter<Point, byte[]> {

    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);

    @Override
    public byte[] convertToDatabaseColumn(Point attribute) {
        if (attribute == null) return null;
        if (attribute.getSRID() == 0) {
            attribute.setSRID(4326);
        }
        return new WKBWriter(2, ByteOrderValues.LITTLE_ENDIAN, true).write(attribute);
    }

    @Override
    public Point convertToEntityAttribute(byte[] dbData) {
        if (dbData == null || dbData.length == 0) return null;
        try {
            WKBReader wkbReader = new WKBReader(geometryFactory);
            byte[] bytes = dbData;

            // Kiểm tra nếu dữ liệu dưới DB là chuỗi Hex WKB bị lưu thành Byte ASCII
            if (bytes.length >= 4 && bytes[0] == 0x30 && bytes[1] == 0x31) {
                String hexString = new String(bytes);
                bytes = WKBReader.hexToBytes(hexString);
            }

            Point point = (Point) wkbReader.read(bytes);
            point.setSRID(4326);
            return point;
        } catch (Exception e) {
            try {
                String hexString = new String(dbData);
                byte[] decodedBytes = WKBReader.hexToBytes(hexString);
                Point point = (Point) new WKBReader(geometryFactory).read(decodedBytes);
                point.setSRID(4326);
                return point;
            } catch (Exception ex) {
                throw new IllegalArgumentException("Không thể deserialize WKB Point geom: " + e.getMessage(), e);
            }
        }
    }
}

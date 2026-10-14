package com.example.backend_imdf_ctu.mapper;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.LineString;
import org.locationtech.jts.geom.PrecisionModel;
import org.locationtech.jts.io.ByteOrderValues;
import org.locationtech.jts.io.WKBReader;
import org.locationtech.jts.io.WKBWriter;

@Converter(autoApply = false)
public class LineStringConvert implements AttributeConverter<LineString, byte[]> {

    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);

    @Override
    public byte[] convertToDatabaseColumn(LineString attribute) {
        if (attribute == null) return null;
        if (attribute.getSRID() == 0) {
            attribute.setSRID(4326);
        }
        return new WKBWriter(2, ByteOrderValues.LITTLE_ENDIAN, true).write(attribute);
    }

    @Override
    public LineString convertToEntityAttribute(byte[] dbData) {
        if (dbData == null || dbData.length == 0) return null;
        try {
            WKBReader wkbReader = new WKBReader(geometryFactory);
            byte[] bytes = dbData;

            // Kiểm tra nếu dữ liệu dưới DB là chuỗi Hex WKB bị lưu thành Byte ASCII (bắt đầu bằng "0102" -> 0x30 0x31 0x30 0x32)
            if (bytes.length >= 4 && bytes[0] == 0x30 && bytes[1] == 0x31) {
                String hexString = new String(bytes);
                bytes = WKBReader.hexToBytes(hexString);
            }

            LineString lineString = (LineString) wkbReader.read(bytes);
            lineString.setSRID(4326);
            return lineString;
        } catch (Exception e) {
            // Nếu đọc WKB trực tiếp thất bại, thử decode theo dạng Hex String
            try {
                String hexString = new String(dbData);
                byte[] decodedBytes = WKBReader.hexToBytes(hexString);
                LineString lineString = (LineString) new WKBReader(geometryFactory).read(decodedBytes);
                lineString.setSRID(4326);
                return lineString;
            } catch (Exception ex) {
                throw new IllegalArgumentException("Không thể deserialize WKB geom: " + e.getMessage(), e);
            }
        }
    }
}

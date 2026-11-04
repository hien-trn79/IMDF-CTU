package com.example.backend_imdf_ctu.entity;

import com.example.backend_imdf_ctu.mapper.PointConvert;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.locationtech.jts.geom.Point;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "amenities")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Amenity implements GeoJson {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "amenity_id", unique = true)
    private UUID amenityId;

    @Column(name = "amenity_name")
    private String amenityName;

    @JdbcTypeCode(SqlTypes.GEOMETRY)
    @Column(name = "geometry", columnDefinition = "geometry(Point, 4326)")
    private Point geometry;

    @Column(name = "phone")
    private String phone;

    @Column(name = "website")
    private String website;

    @CreationTimestamp
    @Column(name = "hours")
    private LocalDateTime hours;

    @Column(name = "correlation_id")
    private UUID correlationId;

    @PrePersist
    public void autofill() {
        if (this.amenityId == null) {
            this.amenityId = UUID.randomUUID();
        }
        if (this.correlationId == null) {
            this.correlationId = UUID.randomUUID();
        }
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "amenity_category_id", referencedColumnName = "id")
    private AmenityCategory amenityCategory;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "feature_id", referencedColumnName = "id")
    private Feature feature;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unit_id", referencedColumnName = "id", nullable = true)
    private Unit unit;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "level_id", referencedColumnName = "id")
    private Level level;

    @CreationTimestamp
    @Column(name = "create_at")
    private LocalDateTime createAt;

    // === Triển khai các phương thức từ GeoJsonEntity ===
    @Override
    public Map<String, Object> getProperties() {
        Map<String, Object> props = new HashMap<>();
        props.put("amenityName", this.amenityName);
        props.put("featureId", this.feature.getId());
        props.put("featureType", this.feature.getFeatureType());
        props.put("amenityCateId", this.amenityCategory.getId());
        props.put("amenityCateName", this.amenityCategory.getAmenityCategoryName());
        props.put("unitId", this.unit != null ? this.unit.getUnitId() : null);
        props.put("unitName", this.unit != null ? this.unit.getUnitName() : null);
        props.put("ordinal", this.level.getOrdinal());
        props.put("createAt", this.createAt);

        return props;
    }
}

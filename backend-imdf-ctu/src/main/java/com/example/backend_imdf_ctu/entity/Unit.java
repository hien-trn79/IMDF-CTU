package com.example.backend_imdf_ctu.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.locationtech.jts.geom.MultiPolygon;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.Polygon;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "unit")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Unit implements GeoJson{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "unit_id", nullable = false, unique = true)
    private UUID unitId;

    @PrePersist
    private void prePersist() {
        if (unitId == null) {
            unitId = UUID.randomUUID();
        }
    }

    @Column(name = "unit_name", nullable = false)
    private String unitName;

    @Column(name = "geometry", nullable = false, columnDefinition = "geometry(MultiPolygon, 4326)")
    private MultiPolygon geometry;

    @Column(name = "display_point", nullable = false, columnDefinition = "geometry(Point, 4326)")
    private Point displayPoint;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "feature_id", nullable = false)
    private Feature feature;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "level_id", nullable = false)
    private Level level;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unit_category_id", nullable = false)
    private UnitCategory unitCategory;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restriction_category_id", nullable = false)
    private RestrictionCategory restrictionCategory;

    // === Triển khai các phương thức từ GeoJsonEntity ===

    @Override
    public Map<String, Object> getProperties() {
        Map<String, Object> props = new HashMap<>();
        props.put("unitName", this.unitName);
        props.put("featureId", this.feature.getFeatureId());
        props.put("featureType", this.feature.getFeatureType());
        props.put("levelId", this.level.getId());
        props.put("levelOrdinal", this.level.getOrdinal());
        props.put("unitCategoryId", this.unitCategory.getId());
        props.put("unitCategory", this.unitCategory.getUnitCategoryName());
        props.put("restrictionCategoryId", this.restrictionCategory.getId());
        props.put("restrictionCategory", this.restrictionCategory.getRestrictionCateName());
        props.put("displayPoint", this.displayPoint); // Sẽ được GeometryConverter xử lý nếu cần

        return props;
    }
}

package com.example.backend_imdf_ctu.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.locationtech.jts.geom.MultiPolygon;
import org.locationtech.jts.geom.Point;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "building")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Building implements GeoJson {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "building_id", nullable = false, unique = true)
    private UUID buildingId;

    @Column(name = "building_name", nullable = false)
    private String buildingName;

    @PrePersist
    public void autofill() {
        if (this.buildingId == null) {
            this.buildingId = UUID.randomUUID();
        }
    }

    @JdbcTypeCode(SqlTypes.GEOMETRY)
    @Column(name = "display_point", nullable = false, columnDefinition = "geometry(Point, 4326)")
    private Point displayPoint;

    @JdbcTypeCode(SqlTypes.GEOMETRY)
    @Column(name = "geometry", nullable = false, columnDefinition = "geometry(MultiPolygon, 4326)")
    private MultiPolygon geometry;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "feature_id", referencedColumnName = "id")
    private Feature feature;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "address_id", referencedColumnName = "id")
    private Address address;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restriction_category_id", referencedColumnName = "id")
    private RestrictionCategory restrictionCategory;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "building_category_id", referencedColumnName = "id")
    private BuildingCategory buildingCategory;

    // === Triển khai các phương thức từ GeoJsonEntity ===

    @Override
    public Map<String, Object> getProperties() {
        Map<String, Object> props = new HashMap<>();
        props.put("featureId", this.feature.getFeatureId());
        props.put("addressId", this.address.getId());
        props.put("buildingName", this.buildingName);
        props.put("buildingCategoryId", this.buildingCategory.getId());
        props.put("buildingCategoryName", this.buildingCategory.getBuildingCategoryVietnameseName());
        props.put("restrictionCategoryId", this.restrictionCategory.getId());
        props.put("displayPoint", this.displayPoint); // Sẽ được GeometryConverter xử lý nếu cần

        return props;
    }
}

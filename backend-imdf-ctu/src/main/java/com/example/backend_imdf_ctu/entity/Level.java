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
@Table(name = "level")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Level implements GeoJson {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "level_id", nullable = false)
    private UUID levelId;

    @PrePersist
    private void prePersist() {
        if (levelId == null) {
            levelId = UUID.randomUUID();
        }
    }

    @JdbcTypeCode(SqlTypes.GEOMETRY)
    @Column(name = "geometry", nullable = false, columnDefinition = "geometry(MultiPolygon, 4326)")
    private MultiPolygon geometry;

    @Column(name = "outdoor")
    private Boolean outdoor = false;

    @Column(name = "ordinal")
    private Integer ordinal;

    @JdbcTypeCode(SqlTypes.GEOMETRY)
    @Column(name = "display_point", columnDefinition = "geometry(Point, 4326)")
    private Point displayPoint;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "level_category_id", nullable = false)
    private LevelCategory levelCategory;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restriction_category_id", nullable = false, referencedColumnName = "id")
    private RestrictionCategory restrictionCategory;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "building_id", nullable = false, referencedColumnName = "id")
    private Building building;

    // === Triển khai các phương thức từ GeoJsonEntity ===

    @Override
    public Map<String, Object> getProperties() {
        Map<String, Object> props = new HashMap<>();
        props.put("levelId", this.levelId);
        props.put("outdoor", this.outdoor);
        props.put("ordinal", this.ordinal);
        props.put("displayPoint", this.displayPoint); // Sẽ được GeometryConverter xử lý nếu cần

        if (this.levelCategory != null) {
            props.put("levelCategoryId", this.levelCategory.getId());
        }
        if (this.restrictionCategory != null) {
            props.put("restrictionCategoryId", this.restrictionCategory.getId());
        }
        if (this.building != null) {
            props.put("buildingId", this.building.getId());
        }
        return props;
    }
}

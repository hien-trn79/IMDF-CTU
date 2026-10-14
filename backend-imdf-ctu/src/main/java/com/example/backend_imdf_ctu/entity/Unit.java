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
import java.util.UUID;

@Entity
@Table(name = "unit")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Unit {

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
}

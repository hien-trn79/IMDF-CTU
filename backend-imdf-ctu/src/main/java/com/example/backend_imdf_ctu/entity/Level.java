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

import java.util.UUID;

@Entity
@Table(name = "level")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Level {

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
}

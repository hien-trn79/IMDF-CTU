package com.example.backend_imdf_ctu.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.locationtech.jts.geom.LineString;
import org.locationtech.jts.geom.Point;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "opening")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Opening {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "opening_id", nullable = false, unique = true)
    private UUID openingId;

    @PrePersist
    private void prePersist() {
        if (this.openingId == null) {
            this.openingId = UUID.randomUUID();
        }
    }

    @Column(name = "opening_name", nullable = false)
    private String openingName;

    @JdbcTypeCode(SqlTypes.GEOMETRY)
    @Column(name = "geometry", nullable = false, columnDefinition = "geometry(LineString, 4326)")
    private LineString geometry;

    @JdbcTypeCode(SqlTypes.GEOMETRY)
    @Column(name = "display_point", nullable = false, columnDefinition = "geometry(Point, 4326)")
    private Point displayPoint;

    @CreationTimestamp
    @Column(name = "create_at", nullable = false, updatable = false)
    private LocalDateTime createAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unit_id", referencedColumnName = "id")
    private Unit unit;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "opening_category_id", referencedColumnName = "id")
    private OpeningCategory openingCategory;
}

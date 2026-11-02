package com.example.backend_imdf_ctu.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.locationtech.jts.geom.Point;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "anchor")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Anchor implements GeoJson{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "anchor_id", nullable = false, unique = true)
    private UUID anchorId;

    @Column(name = "anchor_name", nullable = false)
    private String anchorName;

    @PrePersist
    private void prePersist() {
        if (anchorId == null) {
            anchorId = UUID.randomUUID();
        }
    }

    @JdbcTypeCode(SqlTypes.GEOMETRY)
    @Column(name = "geometry", nullable = false, columnDefinition = "geometry(Point, 4326)")
    private Point geometry;

    @CreationTimestamp
    @Column(name = "create_at", nullable = false, updatable = false)
    private LocalDateTime createAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "feature_id", referencedColumnName = "id")
    private Feature feature;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unit_id", referencedColumnName = "id")
    private Unit unit;

    // === Triển khai các phương thức từ GeoJsonEntity ===
    @Override
    public Map<String, Object> getProperties() {
        Map<String, Object> props = new HashMap<>();
        props.put("anchorName", this.anchorName);
        props.put("featureId", this.feature.getFeatureId());
        props.put("featureType", this.feature.getFeatureType());
        props.put("unitId", this.unit.getId());
        props.put("unitName", this.unit.getUnitName());
        props.put("ordinal", this.unit.getLevel().getOrdinal());
        props.put("createAt", this.createAt);

        return props;
    }
}

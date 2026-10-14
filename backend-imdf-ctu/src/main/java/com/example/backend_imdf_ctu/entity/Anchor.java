package com.example.backend_imdf_ctu.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.locationtech.jts.geom.Point;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "anchor")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Anchor {
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
}

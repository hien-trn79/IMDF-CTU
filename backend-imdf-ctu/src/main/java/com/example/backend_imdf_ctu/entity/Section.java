package com.example.backend_imdf_ctu.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.Polygon;

import java.util.UUID;

@Entity
@Table(name = "section")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Section {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "section_id", nullable = false, unique = true)
    private UUID sectionId;

    @PrePersist
    public void prePersist() {
        if (sectionId == null) {
            sectionId = UUID.randomUUID();
        }
    }

    @Column(name = "section_name", nullable = false, unique = true)
    private String sectionName;

    @Column(name = "geometry", nullable = false, columnDefinition = "geometry(Polygon, 4326)")
    private Polygon geometry;

    @Column(name = "display_point", nullable = false, columnDefinition = "geometry(Point, 4326)")
    private Point displayPoint;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "feature_id", referencedColumnName = "id")
    private Feature feature;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "section_category_id", referencedColumnName = "id")
    private SectionCategory sectionCategory;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restriction_category_id", referencedColumnName = "id")
    private RestrictionCategory restrictionCategory;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "level_id", referencedColumnName = "id")
    private Level level;
}

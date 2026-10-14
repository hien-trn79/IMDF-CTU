package com.example.backend_imdf_ctu.entity;

import com.example.backend_imdf_ctu.mapper.PointConvert;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.locationtech.jts.geom.Point;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "amenities")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Amenity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "amenity_id", unique = true)
    private UUID amenityId;

    @Column(name = "geometry", columnDefinition = "geometry(Point, 4326)")
    @Convert(converter = PointConvert.class)
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
}

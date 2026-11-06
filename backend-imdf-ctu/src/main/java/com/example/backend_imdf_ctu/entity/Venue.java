package com.example.backend_imdf_ctu.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.locationtech.jts.geom.MultiPolygon;
import org.locationtech.jts.geom.Point;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "venue")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Venue implements GeoJson{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "venue_id", unique = true)
    private UUID venueId;

    @PrePersist
    public void prePersist() {
        if (venueId == null) {
            venueId = UUID.randomUUID();
        }
    }

    @Column(name = "venue_name")
    private String venueName;

    @JdbcTypeCode(SqlTypes.GEOMETRY)
    @Column(name = "geometry", columnDefinition = "geometry(MultiPolygon, 4326)")
    private MultiPolygon geometry;

    @Column(name = "hours")
    private LocalDateTime hours;

    @Column(name = "phone")
    private String phone;

    @Column(name = "website")
    private String website;

    @JdbcTypeCode(SqlTypes.GEOMETRY)
    @Column(name = "display_point", columnDefinition = "geometry(Point, 4326)")
    private Point displayPoint;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "feature_id", referencedColumnName = "id")
    private Feature feature;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "venue_category_id", referencedColumnName = "id")
    private VenueCategory venueCategory;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restriction_category_id", referencedColumnName = "id")
    private RestrictionCategory restrictionCategory;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "address_id", referencedColumnName = "id")
    private Address address;

    @Override
    public Map<String, Object> getProperties() {
        Map<String, Object> props = new HashMap<>();
        props.put("venueId", this.venueId);
        props.put("venueName", this.venueName);

        props.put("featureId", this.feature.getFeatureId());
        props.put("featureType", this.getFeature().getFeatureType());
        props.put("venueCategoryId", this.venueCategory.getId());
        props.put("venueCategoryName", this.venueCategory.getVenueCategoryName());
        props.put("restrictionCategoryId", this.restrictionCategory.getId());
        props.put("restricttionCategoryName", this.getRestrictionCategory().getRestrictionCateName());
        props.put("addressId", this.address.getId());
        props.put("addressName", this.getAddress().getAddress());

        return props;
    }
}

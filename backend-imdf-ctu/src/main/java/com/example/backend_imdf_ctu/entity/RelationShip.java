package com.example.backend_imdf_ctu.entity;

import com.example.backend_imdf_ctu.enums.Direction;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "relationship")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RelationShip {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "relationship_id", nullable = false, unique = true)
    private UUID relationshipId;

    @PrePersist
    public void prePersist() {
        if (relationshipId == null) {
            relationshipId = UUID.randomUUID();
        }
    }

    @Enumerated(
        EnumType.STRING
    )
    @Column(name = "direction", nullable = false)
    private Direction directionEnum;

    @Column(name = "hours")
    private LocalDateTime hours;

    @CreationTimestamp
    @Column(name = "create_at", nullable = false, updatable = false)
    private LocalDateTime createAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "feature_id", referencedColumnName = "id", nullable = false)
    private Feature feature;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "relationship_category_id", referencedColumnName = "id")
    private RelationShipCategory relationShipCategory;
}


package com.example.backend_imdf_ctu.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "features")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Feature {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "uuid", unique = true)
    private UUID featureId;

    // Tự động gán UUID trước khi Entity được save vào DB
    @PrePersist
    public void autofill() {
        if (this.featureId == null) {
            this.featureId = UUID.randomUUID();
        }
    }

    @Column(name = "feature_type")
    private String featureType;
}

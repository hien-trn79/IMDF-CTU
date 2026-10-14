package com.example.backend_imdf_ctu.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "address")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Address {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "address_id", unique = true)
    private UUID addressId;

    @PrePersist
    public void prePersist() {
        if (addressId == null) {
            addressId = UUID.randomUUID();
        }
    }

    @Column(name = "address")
    private String address;

    @Column(name = "unit")
    private String unit;

    @Column(name = "locality")
    private String locality;

    @Column(name = "province")
    private String province;

    @Column(name = "country")
    private String country;

    @Column(name = "postal_code")
    private String postalCode;

    @Column(name = "postal_code_extension")
    private String postalCodeExtension;

    @Column(name = "postal_code_vanity")
    private String postalCodeVanity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "feature_id", referencedColumnName = "id")
    private Feature feature;
}

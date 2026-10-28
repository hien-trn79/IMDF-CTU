package com.example.backend_imdf_ctu.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "venue_category")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class VenueCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "venue_category_name")
    private String venueCategoryName;

    @Column(name = "venue_category_vietnamese_name")
    private String venueCategoryVietnameseName;
}


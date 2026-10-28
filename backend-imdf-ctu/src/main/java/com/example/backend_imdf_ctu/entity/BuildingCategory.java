package com.example.backend_imdf_ctu.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "building_category")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BuildingCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "building_category_name", nullable = false)
    private String buildingCategoryName;

    @Column(name = "building_category_vietnamese_name", nullable = false)
    private String buildingCategoryVietnameseName;
}

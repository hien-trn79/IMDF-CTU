package com.example.backend_imdf_ctu.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "opening_category")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OpeningCategory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "opening_category_name", nullable = false)
    private String openingCategoryName;

    @Column(name = "opening_category_vietnamese_name", nullable = false)
    private String openingCategoryVietnameseName;
}

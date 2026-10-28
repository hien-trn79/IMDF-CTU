package com.example.backend_imdf_ctu.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "level_category")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LevelCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "level_category_name", nullable = false)
    private String levelCategoryName;

    @Column(name = "level_category_vietnamese_name", nullable = false)
    private String levelCategoryVietnameseName;
}

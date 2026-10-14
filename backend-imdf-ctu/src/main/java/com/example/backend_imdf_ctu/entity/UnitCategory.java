package com.example.backend_imdf_ctu.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "unit_category")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UnitCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "unit_category_name", nullable = false)
    private String unitCategoryName;
}

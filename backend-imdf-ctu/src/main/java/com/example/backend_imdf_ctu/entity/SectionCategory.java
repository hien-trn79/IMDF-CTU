package com.example.backend_imdf_ctu.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "section_category")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SectionCategory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "section_category_name", nullable = false, unique = true)
    private String sectionCategoryName;
}

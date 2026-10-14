package com.example.backend_imdf_ctu.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "relationship_category")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RelationShipCategory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "relationship_category_name", nullable = false, unique = true)
    private String relationshipCategoryName;
}

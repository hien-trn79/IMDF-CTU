package com.example.backend_imdf_ctu.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "restriction_category")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RestrictionCategory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "restriction_cate_name")
    private String restrictionCateName;
}

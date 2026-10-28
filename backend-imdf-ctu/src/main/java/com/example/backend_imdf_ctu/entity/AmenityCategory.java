package com.example.backend_imdf_ctu.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Entity
@Table(name = "amenity_categories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AmenityCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "amenity_category_name")
    private String amenityCategoryName;

    @Column(name = "amenity_vietnamese_name")
    private String amenityVietNameseName;

}

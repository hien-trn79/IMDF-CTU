package com.example.backend_imdf_ctu.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class BuildingCategoryResponse {
    private Integer id;
    private String buildingCategoryName;
}

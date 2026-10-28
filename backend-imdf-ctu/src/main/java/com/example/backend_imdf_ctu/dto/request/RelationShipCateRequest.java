package com.example.backend_imdf_ctu.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RelationShipCateRequest {
    @NotBlank
    private String relationshipCategoryName;

    @NotBlank
    private String relationshipCategoryVietnameseName;
}

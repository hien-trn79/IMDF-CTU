package com.example.backend_imdf_ctu.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RestrictionCateResponse {
    private Integer id;

    private String restrictionCateName;

    private String restrictionCateVietnameseName;
}

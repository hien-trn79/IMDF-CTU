package com.example.backend_imdf_ctu.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record GeoJsonGeometry (
    @NotBlank String type,
    @NotNull List<?> coordinates
) {};

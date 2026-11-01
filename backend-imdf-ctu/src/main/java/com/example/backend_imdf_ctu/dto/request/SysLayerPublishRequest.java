package com.example.backend_imdf_ctu.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SysLayerPublishRequest {
    private String tableName;
    private String displayName;
    private String workspace;
    private String description;
    private String geometryType;
    private Integer srid;
    private String styleName;
    private String serviceType;
    private Integer levelId;
}

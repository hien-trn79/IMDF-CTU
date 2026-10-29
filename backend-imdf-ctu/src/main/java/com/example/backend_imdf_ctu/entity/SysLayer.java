package com.example.backend_imdf_ctu.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "sys_layer")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SysLayer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "layer_id")
    private Integer layerId;

    @Column(name = "layer_name")
    private String layerName;

    @Column(name = "display_name")
    private String displayName;

    @Column(name = "workspace")
    private String workspace;

    @Column(name = "geometry_type")
    private String geometryType;

    @Column(name = "srid", columnDefinition = "integer default 4326")
    private Integer srid = 4326;

    @Column(name = "table_name")
    private String tableName;

    @Column(name = "is_published")
    private Boolean isPublished;

    @Column(name = "description")
    private String description;

    @Column(name = "style_name")
    private String styleName;

    @Column(name = "service_type")
    private String serviceType;

    @Column(name = "wms_url")
    private String wmsUrl;

    @Column(name = "wfs_url")
    private String wfsUrl;

    @Column(name = "mvt_url")
    private String mvtUrl;

    @Column(name = "level_id")
    private Integer levelId;

    @CreationTimestamp
    @Column(name = "create_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "update_at")
    private LocalDateTime updateAt;
}

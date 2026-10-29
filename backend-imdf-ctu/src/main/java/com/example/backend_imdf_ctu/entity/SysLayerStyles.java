package com.example.backend_imdf_ctu.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "sys_layer_styles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SysLayerStyles {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "style_id")
    private Integer styleId;

    @Column(name = "style_name")
    private String styleName;

    @Column(name = "sld_body", columnDefinition = "text")
    private String sldBody;

    @Column(name = "is_default")
    private Boolean isDefault;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "layer_id", referencedColumnName = "layer_id")
    private SysLayer sysLayer;
}

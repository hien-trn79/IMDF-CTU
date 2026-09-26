package com.example.backend_imdf_ctu.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "indoor_route")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class IndoorRoute {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "indoor_route_id", nullable = false, updatable = false)
    private UUID indoorRouteId;

    @Column(name = "id", nullable = false)
    private Integer id;

    @Column(name = "indoor_route_name")
    private String indoorRouteName;

    @Column(name = "indoor_route_type")
    private String indoorRouteType;

    @Column(name = "status")
    private String status;
}

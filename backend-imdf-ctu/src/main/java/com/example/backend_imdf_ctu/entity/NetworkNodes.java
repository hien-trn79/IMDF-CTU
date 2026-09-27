package com.example.backend_imdf_ctu.entity;

import jakarta.persistence.*;
import lombok.*;
import org.locationtech.jts.geom.Point;

@Entity
@Table(name = "network_nodes_ctu")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NetworkNodes {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "is_connector", nullable = true)
    private Boolean isConnector;

    @Column(name = "geom", nullable = true, columnDefinition = "geometry(Point, 4326)")
    private Point geom;

    @ManyToOne
    @JoinColumn(name = "indoor_route_id", referencedColumnName = "id")
    private IndoorRoute indoorRoute;
}

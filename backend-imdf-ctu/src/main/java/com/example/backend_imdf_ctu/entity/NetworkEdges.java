package com.example.backend_imdf_ctu.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.locationtech.jts.geom.LineString;

@Entity
@Table(name = "network_edges_ctu")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class NetworkEdges {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "source", referencedColumnName = "id")
    private NetworkNodes source;

    @ManyToOne
    @JoinColumn(name = "target", referencedColumnName = "id")
    private NetworkNodes target;

    @Column(name = "cost")
    private Double cost;

    @Column(name = "reverse_cost")
    private Double reverseCost;

    @Column(name = "geometry", columnDefinition = "geometry(LineString, 4326)")
    private LineString geometry;

    @ManyToOne
    @JoinColumn(name = "indoor_route_id", referencedColumnName = "id")
    private IndoorRoute indoorRoute;
}

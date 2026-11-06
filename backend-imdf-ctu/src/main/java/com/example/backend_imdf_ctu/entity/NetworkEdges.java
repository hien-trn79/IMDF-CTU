package com.example.backend_imdf_ctu.entity;

import com.example.backend_imdf_ctu.mapper.LineStringConvert;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.locationtech.jts.geom.LineString;

import java.util.HashMap;
import java.util.Map;

@Entity
@Table(name = "network_edges_ctu")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class NetworkEdges implements GeoJson {

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
    @JdbcTypeCode(SqlTypes.GEOMETRY)
    private LineString geometry;

    @ManyToOne
    @JoinColumn(name = "indoor_route_id", referencedColumnName = "id")
    private IndoorRoute indoorRoute;

    // === Triển khai các phương thức từ GeoJsonEntity ===
    @Override
    public Map<String, Object> getProperties() {
        Map<String, Object> props = new HashMap<>();
        props.put("sourceNode", this.source.getId());
        props.put("targetNode", this.target.getId());
        props.put("cost", this.cost);
        props.put("reverseCost", this.reverseCost);

        props.put("routeId", this.getIndoorRoute().getId());
        props.put("routeName", this.getIndoorRoute().getIndoorRouteName());
        props.put("routeType", this.getIndoorRoute().getIndoorRouteType());

        props.put("ordinal", this.getIndoorRoute().getLevel().getOrdinal());
        return props;
    }
}

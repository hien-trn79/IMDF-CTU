package com.example.backend_imdf_ctu.entity;

import com.example.backend_imdf_ctu.mapper.PointConvert;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.locationtech.jts.geom.Point;

import java.util.HashMap;
import java.util.Map;

@Entity
@Table(name = "network_nodes_ctu")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NetworkNodes implements GeoJson {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "is_connector", nullable = true)
    private Boolean isConnector;

    @Column(name = "geometry", nullable = true, columnDefinition = "geometry(Point, 4326)")
    @JdbcTypeCode(SqlTypes.GEOMETRY)
    private Point geometry;

    @ManyToOne
    @JoinColumn(name = "indoor_route_id", referencedColumnName = "id")
    private IndoorRoute indoorRoute;

    // === Triển khai các phương thức từ GeoJsonEntity ===

    @Override
    public Map<String, Object> getProperties() {
        Map<String, Object> props = new HashMap<>();
        props.put("isConnector", this.isConnector);

        props.put("routeId", this.getIndoorRoute().getId());
        props.put("routeName", this.getIndoorRoute().getIndoorRouteName());
        props.put("routeType", this.getIndoorRoute().getIndoorRouteType());

        props.put("ordinal", this.getIndoorRoute().getLevel().getOrdinal());
        return props;
    }
}

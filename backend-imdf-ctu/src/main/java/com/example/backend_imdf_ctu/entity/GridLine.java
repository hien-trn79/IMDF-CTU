package com.example.backend_imdf_ctu.entity;

import com.example.backend_imdf_ctu.enums.TopologyCategory;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.locationtech.jts.geom.LineString;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "grid_lines_ctu")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GridLine implements GeoJson {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) //
    @Column(name = "id", nullable = false, updatable = false)
    private Integer id; // Khóa chính số nguyên tự tăng

    @Column(name = "grid_line_id", nullable = false, unique = true, updatable = false)
    private UUID gridLineId; // UUID định danh phụ

    // Tự động gán UUID trước khi Entity được save vào DB
    @PrePersist
    public void autofill() {
        if (this.gridLineId == null) {
            this.gridLineId = UUID.randomUUID();
        }
    }

    @Column(name = "category", nullable = false)
    @Enumerated(EnumType.STRING)
    private TopologyCategory category;

    @Column(name = "is_one_way", nullable = false)
    private Boolean isOneWay;

    @Column(name = "geometry", nullable = false)
    @JdbcTypeCode(SqlTypes.GEOMETRY)
    private LineString geometry;

    // Foreign key liên kết sang IndoorRoute dựa trên Khóa chính 'id' (Integer)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "indoor_route_id", referencedColumnName = "id", nullable = false)
    private IndoorRoute indoorRoute;

    // === Triển khai các phương thức từ GeoJsonEntity ===

    @Override
    public Map<String, Object> getProperties() {
        Map<String, Object> props = new HashMap<>();
        props.put("preTopologyId", this.gridLineId);
        props.put("category", this.category.toString());
        props.put("isOneWay", this.isOneWay);

        props.put("routeId", this.getIndoorRoute().getId());
        props.put("routeName", this.getIndoorRoute().getIndoorRouteName());
        props.put("routeType", this.getIndoorRoute().getIndoorRouteType());

        props.put("ordinal", this.getIndoorRoute().getLevel().getOrdinal());
        return props;
    }
}

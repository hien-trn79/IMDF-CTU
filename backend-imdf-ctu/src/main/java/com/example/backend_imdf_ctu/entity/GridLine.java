package com.example.backend_imdf_ctu.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.locationtech.jts.geom.LineString;

import java.util.UUID;

@Entity
@Table(name = "grid_lines_ctu")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GridLine {

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
    @NotBlank(message = "Category cannot be blank")
    private String category;

    @Column(name = "is_one_way", nullable = false)
    private Boolean isOneWay;

    @NotNull(message = "geom cannot be null")
    @Column(name = "geom", nullable = false)
    private LineString geom;

    // Foreign key liên kết sang IndoorRoute dựa trên Khóa chính 'id' (Integer)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "indoor_route_id", referencedColumnName = "id", nullable = false)
    private IndoorRoute indoorRoute;
}

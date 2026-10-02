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
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Integer id; // Khóa chính số nguyên tự tăng

    @Column(name = "indoor_route_id", nullable = false, unique = true, updatable = false)
    private UUID indoorRouteId; // UUID định danh phụ (Business Key theo IMDF)

    // Tự động gán UUID trước khi Entity được save vào DB
    @PrePersist
    public void autofill() {
        if (this.indoorRouteId == null) {
            this.indoorRouteId = UUID.randomUUID();
        }
    }

    @Column(name = "indoor_route_name")
    private String indoorRouteName;

    @Column(name = "indoor_route_type")
    private String indoorRouteType;

    @Column(name = "status")
    private String status;
}
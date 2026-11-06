package com.example.backend_imdf_ctu.controller;

import com.example.backend_imdf_ctu.dto.geojson.GeoJsonFeature;
import com.example.backend_imdf_ctu.dto.geojson.GeoJsonFeatureCollection;
import com.example.backend_imdf_ctu.dto.request.NetworkEdgesRequest;
import com.example.backend_imdf_ctu.entity.NetworkEdges;
import com.example.backend_imdf_ctu.mapper.GenericGeoJsonMapper;
import com.example.backend_imdf_ctu.service.interfaces.NetworkEdgesService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/network-edges")
@RequiredArgsConstructor
@CrossOrigin
public class NetworkEdgesController {
    private final NetworkEdgesService service;
    private final GenericGeoJsonMapper geoJsonMapper;

    // [GET] /network-edges
    @GetMapping
    public ResponseEntity<GeoJsonFeatureCollection> getAll(
        @RequestParam(name = "routeId") Integer routeId
    ) {
        List<NetworkEdges> edges = service.getAll(routeId);

        return ResponseEntity.ok(geoJsonMapper.toFeatureCollection(edges));
    }

    // [GET] /network-edges/{id}
    @GetMapping("/{id}")
    public ResponseEntity<GeoJsonFeature> getById(@PathVariable Integer id) {
        NetworkEdges edge = service.getById(id);
        return ResponseEntity.ok(geoJsonMapper.toFeature(edge));
    }

    // [POST] /network-edges
    @PostMapping
    public ResponseEntity<GeoJsonFeature> create(
        @RequestBody NetworkEdgesRequest request
        ) {
        return ResponseEntity.ok(geoJsonMapper.toFeature(service.create(request)));
    }

    // [PUT] /network-edges/{id}
    @PutMapping("/{id}")
    public ResponseEntity<GeoJsonFeature> update(
        @PathVariable Integer id,
        @RequestBody NetworkEdgesRequest request
    ) {
        return ResponseEntity.ok(geoJsonMapper.toFeature(service.update(id, request)));
    }

    // [DELETE] /network-edges/{id}
    @DeleteMapping("/{id}")
    public Boolean delete(@PathVariable Integer id) {
        return service.delete(id);
    }
}


package com.example.backend_imdf_ctu.controller;

import com.example.backend_imdf_ctu.dto.geojson.GeoJsonFeature;
import com.example.backend_imdf_ctu.dto.geojson.GeoJsonFeatureCollection;
import com.example.backend_imdf_ctu.dto.request.NetworkNodesRequest;
import com.example.backend_imdf_ctu.entity.NetworkNodes;
import com.example.backend_imdf_ctu.mapper.GenericGeoJsonMapper;
import com.example.backend_imdf_ctu.service.interfaces.NetworkNodesService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/network-nodes")
@RequiredArgsConstructor
@CrossOrigin
public class NetworkNodesController {

    private final NetworkNodesService service;
    private final GenericGeoJsonMapper geoJsonMapper;

    // [GET] /network-nodes
    @GetMapping
    public ResponseEntity<GeoJsonFeatureCollection> getAll(
        @RequestParam(name = "routeId", required = false) Integer routeId
    ) {
        List<NetworkNodes> networkNodesList = service.getAll(routeId);

        return ResponseEntity.ok(geoJsonMapper.toFeatureCollection(networkNodesList));
    }

    // [GET] /network-nodes/{id}
    @GetMapping("/{id}")
    public ResponseEntity<GeoJsonFeature> getById(@PathVariable Integer id) {
        NetworkNodes nodes = service.getById(id);
        return ResponseEntity.ok(geoJsonMapper.toFeature(nodes));
    }

    // [POST] /network-nodes
    @PostMapping
    public ResponseEntity<GeoJsonFeature> create(@RequestBody NetworkNodesRequest request) {
        NetworkNodes response = service.create(request);
        return ResponseEntity.ok(geoJsonMapper.toFeature(response));
    }

    // [PUT] /network-nodes/{id}
    @PutMapping("/{id}")
    public ResponseEntity<GeoJsonFeature> update(
        @PathVariable Integer id,
        @RequestBody NetworkNodesRequest request
    ) {
        NetworkNodes node = service.update(id, request);
        return ResponseEntity.ok(geoJsonMapper.toFeature(node));
    }

    // [DELETE] /network-nodes/{id}
    @DeleteMapping("/{id}")
    public Boolean delete(@PathVariable Integer id) {
        return service.delete(id);
    }
}

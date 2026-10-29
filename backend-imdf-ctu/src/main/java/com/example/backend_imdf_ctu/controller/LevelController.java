package com.example.backend_imdf_ctu.controller;

import com.example.backend_imdf_ctu.dto.geojson.GeoJsonFeature;
import com.example.backend_imdf_ctu.dto.geojson.GeoJsonFeatureCollection;
import com.example.backend_imdf_ctu.dto.request.LevelRequest;
import com.example.backend_imdf_ctu.entity.Level;
import com.example.backend_imdf_ctu.mapper.GenericGeoJsonMapper;
import com.example.backend_imdf_ctu.service.interfaces.LevelService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/levels")
@CrossOrigin
@RequiredArgsConstructor
public class LevelController {

    private final LevelService service;
    private final GenericGeoJsonMapper geoJsonMapper;

    @GetMapping
    public ResponseEntity<GeoJsonFeatureCollection> getAll(
        @RequestParam(name = "buildingId", required = false)
        Integer buildingId
    ) {
        List<Level> levels = service.getAll(buildingId);
        return ResponseEntity.ok(geoJsonMapper.toFeatureCollection(levels));
    }

    // [POST] /levels
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<GeoJsonFeature> create(
        @Valid @RequestBody LevelRequest request
    ) {
        Level level = service.create(request);
        return ResponseEntity.ok(geoJsonMapper.toFeature(level));
    }

    // [PUT] /levels/{id}
    @PutMapping("/{id}")
    public ResponseEntity<GeoJsonFeature> update(
        @PathVariable Integer id,
        @Valid @RequestBody LevelRequest request
    ) {
        Level level = service.update(id, request);
        return ResponseEntity.ok(geoJsonMapper.toFeature(level));
    }

}

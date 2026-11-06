package com.example.backend_imdf_ctu.controller;

import com.example.backend_imdf_ctu.dto.geojson.GeoJsonFeature;
import com.example.backend_imdf_ctu.dto.geojson.GeoJsonFeatureCollection;
import com.example.backend_imdf_ctu.dto.request.BuildingRequest;
import com.example.backend_imdf_ctu.entity.Building;
import com.example.backend_imdf_ctu.mapper.GenericGeoJsonMapper;
import com.example.backend_imdf_ctu.service.interfaces.BuildingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/buildings")
@CrossOrigin
@RequiredArgsConstructor
public class BuildingController {

    private final BuildingService service;
    private final GenericGeoJsonMapper geoJsonMapper;

    // [GET] /buildings
    @GetMapping
    public ResponseEntity<GeoJsonFeatureCollection> getAll(
        @RequestParam(name = "venueId") Integer venueId
    ) {
        List<Building> buildings = service.getAll(venueId);
        return ResponseEntity.ok(geoJsonMapper.toFeatureCollection(buildings));
    }

    // [GET] /buildings/{id}
    @GetMapping(value = "/{id}", produces = "application/geo+json")
    public ResponseEntity<GeoJsonFeature> getById(@PathVariable Integer id) {
        Building building = service.getById(id);
        return ResponseEntity.ok(geoJsonMapper.toFeature(building));
    }

    // [POST] /buildings
    @PostMapping(produces = "application/geo+json")
    public ResponseEntity<GeoJsonFeature> create(@Valid @RequestBody BuildingRequest request) {
        Building building = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(geoJsonMapper.toFeature(building));
    }

    // [PUT] /buildings/{id}
    @PutMapping(value = "/{id}", produces = "application/geo+json")
    public ResponseEntity<GeoJsonFeature> update(
        @PathVariable Integer id,
        @Valid @RequestBody BuildingRequest request
    ) {
        Building building = service.update(id, request);
        return ResponseEntity.ok(geoJsonMapper.toFeature(building));
    }

    // [DELETE] /buildings/{id}
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Integer id) {
        service.delete(id);
    }
}
package com.example.backend_imdf_ctu.controller;

import com.example.backend_imdf_ctu.dto.geojson.GeoJsonFeature;
import com.example.backend_imdf_ctu.dto.geojson.GeoJsonFeatureCollection;
import com.example.backend_imdf_ctu.dto.request.AmenityRequest;
import com.example.backend_imdf_ctu.entity.Amenity;
import com.example.backend_imdf_ctu.mapper.GenericGeoJsonMapper;
import com.example.backend_imdf_ctu.service.interfaces.AmenityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/amenities")
@CrossOrigin
@RequiredArgsConstructor
public class AmenityController {

    private final AmenityService service;
    private final GenericGeoJsonMapper geoJsonMapper;

    // [GET] /amenities
    @GetMapping
    public ResponseEntity<GeoJsonFeatureCollection> getAll(
        @RequestParam(name = "levelId", required = false) Integer levelId
    ) {
         List<Amenity> amenities = service.getAll(levelId);
         return ResponseEntity.ok(geoJsonMapper.toFeatureCollection(amenities));
    }

    // [GET] /amenities/{id}
    @GetMapping("/{id}")
    public ResponseEntity<GeoJsonFeature> getById(@PathVariable("id") Integer id) {
        Amenity amenity = service.getById(id);
        return ResponseEntity.ok(geoJsonMapper.toFeature(amenity));
    }

    // [POST] /amenities
    @PostMapping
    public ResponseEntity<GeoJsonFeature> create(@RequestBody AmenityRequest request) {
        Amenity amenity = service.create(request);
        return ResponseEntity.ok(geoJsonMapper.toFeature(amenity));
    }

    // [PUT] /amenities/{id}
    @PutMapping("/{id}")
    public ResponseEntity<GeoJsonFeature> update(
        @PathVariable("id") Integer id,
        @RequestBody AmenityRequest request
    ) {
        Amenity amenity = service.update(id, request);
        return ResponseEntity.ok(geoJsonMapper.toFeature(amenity));
    }

    // [DELETE] /amenities/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable("id") Integer id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}

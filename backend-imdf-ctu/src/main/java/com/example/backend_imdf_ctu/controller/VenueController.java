package com.example.backend_imdf_ctu.controller;

import com.example.backend_imdf_ctu.dto.geojson.GeoJsonFeature;
import com.example.backend_imdf_ctu.dto.geojson.GeoJsonFeatureCollection;
import com.example.backend_imdf_ctu.dto.request.VenueRequest;
import com.example.backend_imdf_ctu.dto.response.VenueResponse;
import com.example.backend_imdf_ctu.entity.Venue;
import com.example.backend_imdf_ctu.mapper.GenericGeoJsonMapper;
import com.example.backend_imdf_ctu.service.interfaces.VenueService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/venues")
@CrossOrigin
@RequiredArgsConstructor
public class VenueController {

    private final VenueService service;
    private final GenericGeoJsonMapper geoJsonMapper;

    // [GET] /venues
    @GetMapping
    public ResponseEntity<GeoJsonFeatureCollection> getAll() {
        List<Venue> venues = service.getAll();
        return ResponseEntity.ok(geoJsonMapper.toFeatureCollection(venues));
    }

    // [GET] /venues/{id}
    @GetMapping("/{id}")
    public ResponseEntity<GeoJsonFeature> getById(@PathVariable Integer id) {
        Venue venue = service.getById(id);
        return ResponseEntity.ok(geoJsonMapper.toFeature(venue));
    }

    // [POST] /venues
    @PostMapping
    public ResponseEntity<GeoJsonFeature> create(@RequestBody VenueRequest request) {
        Venue venue = service.create(request);
        return ResponseEntity.ok(geoJsonMapper.toFeature(venue));
    }

    // [PUT] /venues/{id}
    @PutMapping("/{id}")
    public ResponseEntity<GeoJsonFeature> update(@PathVariable Integer id, @RequestBody VenueRequest request) {
        Venue venue = service.update(id, request);
        return ResponseEntity.ok(geoJsonMapper.toFeature(venue));
    }

    // [DELETE] /venues/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}

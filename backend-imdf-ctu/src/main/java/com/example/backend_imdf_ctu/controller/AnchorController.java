package com.example.backend_imdf_ctu.controller;

import com.example.backend_imdf_ctu.dto.geojson.GeoJsonFeature;
import com.example.backend_imdf_ctu.dto.geojson.GeoJsonFeatureCollection;
import com.example.backend_imdf_ctu.dto.request.AnchorRequest;
import com.example.backend_imdf_ctu.entity.Anchor;
import com.example.backend_imdf_ctu.mapper.GenericGeoJsonMapper;
import com.example.backend_imdf_ctu.service.interfaces.AnchorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/anchors")
@CrossOrigin
@RequiredArgsConstructor
public class AnchorController {

    private final AnchorService service;
    private final GenericGeoJsonMapper geoJsonMapper;

    // [GET] /anchors
    @GetMapping
    public ResponseEntity<GeoJsonFeatureCollection> getAll(
        @RequestParam(name = "levelId", required = false) Integer levelId
    ) {
        List<Anchor> anchors = service.getAllByUnitLevelId(levelId);
        return ResponseEntity.ok(geoJsonMapper.toFeatureCollection(anchors));
    }

    // [GET] /anchors/{id}
    @GetMapping("/{id}")
    public ResponseEntity<GeoJsonFeature> getById(@PathVariable Integer id) {
        Anchor anchor = service.getById(id);
        return ResponseEntity.ok(geoJsonMapper.toFeature(anchor));
    }

    // [POST] /anchors
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<GeoJsonFeature> create(
        @Valid @RequestBody AnchorRequest request
    ) {
        Anchor anchor = service.create(request);
        return ResponseEntity.ok(geoJsonMapper.toFeature(anchor));
    }

    // [GET] /anchors/unit?{unitId}
    @GetMapping("/unit")
    public ResponseEntity<GeoJsonFeature> getByUnitId(@RequestParam(name = "unitId") Integer unitId) {
        Anchor anchor = service.getByUnitId(unitId);
        return ResponseEntity.ok(geoJsonMapper.toFeature(anchor));
    }


    // [PUT] /anchors/{id}
    @PutMapping("/{id}")
    public ResponseEntity<GeoJsonFeature> update(@PathVariable Integer id,@Valid @RequestBody AnchorRequest request) {
        Anchor anchor = service.update(id, request);
        return ResponseEntity.ok(geoJsonMapper.toFeature(anchor));
    }

    // [DELETE] /anchors/{id}
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Integer id) {
        service.delete(id);
    }
}

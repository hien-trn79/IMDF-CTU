package com.example.backend_imdf_ctu.controller;

import com.example.backend_imdf_ctu.dto.geojson.GeoJsonFeature;
import com.example.backend_imdf_ctu.dto.geojson.GeoJsonFeatureCollection;
import com.example.backend_imdf_ctu.dto.request.GridLineRequest;
import com.example.backend_imdf_ctu.entity.GridLine;
import com.example.backend_imdf_ctu.mapper.GenericGeoJsonMapper;
import com.example.backend_imdf_ctu.service.interfaces.GridLineService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/grid-lines")
@RequiredArgsConstructor
@CrossOrigin
public class GridLineController {

    private final GridLineService service;
    private final GenericGeoJsonMapper geoJsonMapper;

    // [GET] /grid-lines
    @GetMapping
    public ResponseEntity<GeoJsonFeatureCollection> getAll(
        @RequestParam (name = "levelId") Integer levelId
    ) {
        List<GridLine> gridLines = service.getAll(levelId);

        return ResponseEntity.ok(geoJsonMapper.toFeatureCollection(gridLines));
    }

    // [POST] /grid-lines
    @PostMapping
    public ResponseEntity<GeoJsonFeature> create(
        @RequestBody GridLineRequest request
    ) {
        GridLine gridLine = service.create(request);

        return ResponseEntity.ok(geoJsonMapper.toFeature(gridLine));
    }

    // [PUT] /grid-lines/{gridLineId}
    @PutMapping("/{gridLineId}")
    public ResponseEntity<GeoJsonFeature> update(
        @PathVariable Integer gridLineId,
        @RequestBody GridLineRequest request
    ) {
        GridLine gridLine = service.update(gridLineId, request);

        return ResponseEntity.ok(geoJsonMapper.toFeature(gridLine));
    }


    // [DELETE] /grid-lines/{gridLineId}
    @DeleteMapping("/{gridLineId}")
    public Boolean delete(@PathVariable Integer gridLineId) {
        return service.delete(gridLineId);
    }
}

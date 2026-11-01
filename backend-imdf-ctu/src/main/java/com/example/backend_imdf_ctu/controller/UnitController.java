package com.example.backend_imdf_ctu.controller;

import com.example.backend_imdf_ctu.dto.geojson.GeoJsonFeature;
import com.example.backend_imdf_ctu.dto.geojson.GeoJsonFeatureCollection;
import com.example.backend_imdf_ctu.dto.request.UnitRequest;
import com.example.backend_imdf_ctu.dto.response.UnitResponse;
import com.example.backend_imdf_ctu.entity.Unit;
import com.example.backend_imdf_ctu.mapper.GenericGeoJsonMapper;
import com.example.backend_imdf_ctu.service.interfaces.UnitService;
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
@RequestMapping("/units")
@CrossOrigin
@RequiredArgsConstructor
public class UnitController {

    private final UnitService service;
    private final GenericGeoJsonMapper geoJsonMapper;

//    // [GET] /units
    @GetMapping
    public ResponseEntity<GeoJsonFeatureCollection> getAll(
        @ParameterObject
        @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.ASC)
        Pageable pageable) {
        Page<Unit> list =  service.getAll(pageable);
        return ResponseEntity.ok(geoJsonMapper.toFeatureCollection(list));
    }
//
    // [GET] /units/{id}
    @GetMapping("/{id}")
    public ResponseEntity<GeoJsonFeature> getById(@PathVariable Integer id) {
        Unit unit =  service.getById(id);
        return ResponseEntity.ok(geoJsonMapper.toFeature(unit));
    }

    // [GET] /units?levelId={levelId}
    @GetMapping(params = "levelId")
    public ResponseEntity<GeoJsonFeatureCollection> getAllByLevelId(
        @RequestParam Integer levelId){
        List<Unit> units= service.getAllByLevelId(levelId);

        return ResponseEntity.ok(geoJsonMapper.toFeatureCollection(units));
    }

    // [POST] /units
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<GeoJsonFeature> create(@Valid @RequestBody UnitRequest request) {

        Unit unit = service.create(request);

        return ResponseEntity.status(HttpStatus.CREATED).body(geoJsonMapper.toFeature(unit));
    }

    // [PUT] /units/{id}
    @PutMapping("/{id}")
    public ResponseEntity<GeoJsonFeature> update(
        @PathVariable Integer id,
        @Valid @RequestBody UnitRequest request) {

        Unit unit = service.update(id, request);

        return ResponseEntity.ok(geoJsonMapper.toFeature(unit));
    }

    // [DELETE] /units/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

}

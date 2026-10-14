package com.example.backend_imdf_ctu.controller;

import com.example.backend_imdf_ctu.dto.request.BuildingRequest;
import com.example.backend_imdf_ctu.dto.response.BuildingResponse;
import com.example.backend_imdf_ctu.service.interfaces.BuildingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/buildings")
@CrossOrigin
@RequiredArgsConstructor
public class BuildingController {
    private final BuildingService service;

    // [GET] /buildings
    @GetMapping
    public Page<BuildingResponse> list(Pageable pageable) {
        return service.list(pageable);
    }

    // [GET] /buildings/{id}
    @GetMapping("/{id}")
    public BuildingResponse getById(@PathVariable Integer id) {
        return service.getById(id);
    }

    // [POST] /buildings
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BuildingResponse create(@Valid @RequestBody BuildingRequest request) {
        return service.create(request);
    }

    // [PUT] /buildings/{id}
    @PutMapping("/{id}")
    public BuildingResponse update(@PathVariable Integer id, @Valid @RequestBody BuildingRequest request) {
        return service.update(id, request);
    }

    // [DELETE] /buildings/{id}
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Integer id) {
        service.delete(id);
    }
}

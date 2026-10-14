package com.example.backend_imdf_ctu.controller;

import com.example.backend_imdf_ctu.dto.request.UnitRequest;
import com.example.backend_imdf_ctu.dto.response.UnitResponse;
import com.example.backend_imdf_ctu.service.interfaces.UnitService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/units")
@CrossOrigin
@RequiredArgsConstructor
public class UnitController {

    private final UnitService service;

    // [GET] /units
    @GetMapping
    public Page<UnitResponse> getAll(Pageable pageable) {
        return service.getAll(pageable);
    }

    // [GET] /units/{id}
    @GetMapping("/{id}")
    public UnitResponse getById(@PathVariable Integer id) {
        return service.getById(id);
    }

    // [POST] /units
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UnitResponse create(@Valid @RequestBody UnitRequest request) {
        return service.create(request);
    }

    // [PUT] /units/{id}
    @PutMapping("/{id}")
    public UnitResponse update(@PathVariable Integer id, @Valid @RequestBody UnitRequest request) {
        return service.update(id, request);
    }

    // [DELETE] /units/{id}
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Integer id) {
        service.delete(id);
    }
}

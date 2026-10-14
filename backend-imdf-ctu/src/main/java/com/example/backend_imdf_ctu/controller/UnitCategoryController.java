package com.example.backend_imdf_ctu.controller;

import com.example.backend_imdf_ctu.dto.request.UnitCategoryRequest;
import com.example.backend_imdf_ctu.dto.response.UnitCategoryResponse;
import com.example.backend_imdf_ctu.service.interfaces.UnitCategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/unit-categories")
@CrossOrigin
@RequiredArgsConstructor
public class UnitCategoryController {
    private final UnitCategoryService service;

    // [GET] /unit-categories
    @GetMapping
    public List<UnitCategoryResponse> getAll() {
        return service.getAll();
    }

    // [GET] /unit-categories/{id}
    @GetMapping("/{id}")
    @ResponseStatus(HttpStatus.CREATED)
    public UnitCategoryResponse getById(@PathVariable Integer id) {
        return service.getById(id);
    }

    // [POST] /unit-categories
    @PostMapping
    public UnitCategoryResponse create(@Valid @RequestBody UnitCategoryRequest request) {
        return service.create(request);
    }
}

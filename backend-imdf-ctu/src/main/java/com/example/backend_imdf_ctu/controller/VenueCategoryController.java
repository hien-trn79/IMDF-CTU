package com.example.backend_imdf_ctu.controller;

import com.example.backend_imdf_ctu.dto.request.VenueCategoryRequest;
import com.example.backend_imdf_ctu.dto.response.VenueCategoryResponse;
import com.example.backend_imdf_ctu.service.interfaces.VenueCategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/venue-categories")
@CrossOrigin
@RequiredArgsConstructor
public class VenueCategoryController {

    private final VenueCategoryService service;

    // [GET] /venue-categories
    @GetMapping
    public List<VenueCategoryResponse> getAll() {
        return service.getAll();
    }

    // [POST] /venue-categories
    @PostMapping
    public VenueCategoryResponse create(@RequestBody VenueCategoryRequest request) {
        return service.create(request);
    }
}

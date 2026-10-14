package com.example.backend_imdf_ctu.controller;

import com.example.backend_imdf_ctu.dto.request.BuildingCategoryRequest;
import com.example.backend_imdf_ctu.dto.response.BuildingCategoryResponse;
import com.example.backend_imdf_ctu.service.interfaces.BuildingCategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/building-categories")
@CrossOrigin
@RequiredArgsConstructor
public class BuildingCategoryController {

    private final BuildingCategoryService service;

    @GetMapping
    public List<BuildingCategoryResponse> getAll() {
         return service.getAll();
    }

    @PostMapping
    public BuildingCategoryResponse create(@RequestBody BuildingCategoryRequest request) {
        return service.create(request);
    }
}

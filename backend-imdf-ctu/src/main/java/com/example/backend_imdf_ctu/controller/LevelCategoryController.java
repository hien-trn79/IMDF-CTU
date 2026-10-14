package com.example.backend_imdf_ctu.controller;

import com.example.backend_imdf_ctu.dto.request.LevelCategoryRequest;
import com.example.backend_imdf_ctu.dto.response.LevelCategoryResponse;
import com.example.backend_imdf_ctu.service.interfaces.LevelCategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/level-categories")
@CrossOrigin
@RequiredArgsConstructor
public class LevelCategoryController {
    private final LevelCategoryService service;

    // [GET] /level-categories
    @GetMapping
    public List<LevelCategoryResponse> getAll() {
        return service.getAll();
    }

    // [POST] /level-categories
    @PostMapping
    public LevelCategoryResponse create(@RequestBody LevelCategoryRequest request) {
        return service.create(request);
    }
}

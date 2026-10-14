package com.example.backend_imdf_ctu.controller;

import com.example.backend_imdf_ctu.dto.request.SectionCategoryRequest;
import com.example.backend_imdf_ctu.dto.response.SectionCategoryResponse;
import com.example.backend_imdf_ctu.service.interfaces.SectionCategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/section-category")
@CrossOrigin
public class SectionCategoryController {

    private final SectionCategoryService service;

    @GetMapping
    public List<SectionCategoryResponse> getAll() {
        return service.getAll();
    }

    @PostMapping
    public SectionCategoryResponse create(@RequestBody SectionCategoryRequest request) {
        return service.create(request);
    }
}

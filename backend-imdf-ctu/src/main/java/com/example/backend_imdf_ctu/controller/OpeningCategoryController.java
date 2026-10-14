package com.example.backend_imdf_ctu.controller;

import com.example.backend_imdf_ctu.dto.request.OpeningCategoryRequest;
import com.example.backend_imdf_ctu.dto.response.OpeningCategoryResponse;
import com.example.backend_imdf_ctu.service.interfaces.OpeningCategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/opening-categories")
@CrossOrigin
@RequiredArgsConstructor
public class OpeningCategoryController {
    private final OpeningCategoryService service;

    @GetMapping
    public List<OpeningCategoryResponse> getAll() {
        return service.getAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OpeningCategoryResponse create(@RequestBody OpeningCategoryRequest request) {
        return service.create(request);
    }
}

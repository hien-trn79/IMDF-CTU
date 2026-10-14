package com.example.backend_imdf_ctu.controller;

import com.example.backend_imdf_ctu.dto.request.RestrictionCateRequest;
import com.example.backend_imdf_ctu.dto.response.RestrictionCateResponse;
import com.example.backend_imdf_ctu.service.interfaces.RestrictionCateService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/restriction-categories")
@CrossOrigin
@RequiredArgsConstructor
public class RestrictionCateController {

    private final RestrictionCateService service;

    // [GET] /restriction-categories/{id}
    @GetMapping("/{id}")
    public RestrictionCateResponse getById(Integer id) {
        return service.getById(id);
    }

    // [POST] /restriction-categories
    @PostMapping
    public RestrictionCateResponse create(@RequestBody RestrictionCateRequest request) {
        return service.create(request);
    }
}

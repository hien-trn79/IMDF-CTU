package com.example.backend_imdf_ctu.controller;

import com.example.backend_imdf_ctu.dto.request.AmenityCateRequest;
import com.example.backend_imdf_ctu.dto.response.AmenityCateResponse;
import com.example.backend_imdf_ctu.service.interfaces.AmenityCategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/amenity-categories")
@CrossOrigin
@RequiredArgsConstructor
public class AmenityCateController {

    private final AmenityCategoryService service;

    // [GET] /amenity-categories
    @GetMapping
    public List<AmenityCateResponse> getAll() {
         return service.getAll();
    }

    @PostMapping
    public AmenityCateResponse create(@RequestBody AmenityCateRequest request) {
        return service.create(request);
    }
}

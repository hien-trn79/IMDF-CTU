package com.example.backend_imdf_ctu.controller;

import com.example.backend_imdf_ctu.dto.request.AmenityRequest;
import com.example.backend_imdf_ctu.dto.response.AmenityResponse;
import com.example.backend_imdf_ctu.service.interfaces.AmenityService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/amenities")
@CrossOrigin
@RequiredArgsConstructor
public class AmenityController {

    private final AmenityService service;

    // [GET] /amenities
    @GetMapping
    public List<AmenityResponse> getAll() {
         return service.getAll();
    }

    // [POST] /amenities
    @PostMapping
    public AmenityResponse create(@RequestBody AmenityRequest request) {
        return service.create(request);
    }
}

package com.example.backend_imdf_ctu.controller;

import com.example.backend_imdf_ctu.dto.request.FeatureRequest;
import com.example.backend_imdf_ctu.dto.response.FeatureResponse;
import com.example.backend_imdf_ctu.service.interfaces.FeatureService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/features")
@CrossOrigin
@RequiredArgsConstructor
public class FeatureController {

    private final FeatureService service;

    @GetMapping
    public List<FeatureResponse> getAll() {
        return service.getAll();
    }

    @PostMapping
    public FeatureResponse create(@RequestBody FeatureRequest request) {
        return service.create(request);
    }
}

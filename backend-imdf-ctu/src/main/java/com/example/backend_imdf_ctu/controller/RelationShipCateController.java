package com.example.backend_imdf_ctu.controller;

import com.example.backend_imdf_ctu.dto.request.RelationShipCateRequest;
import com.example.backend_imdf_ctu.dto.response.RelationShipCateResponse;
import com.example.backend_imdf_ctu.service.interfaces.RelationShipCateService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin
@RestController
@RequestMapping("/relationship-categories")
@RequiredArgsConstructor
public class RelationShipCateController {
    private final RelationShipCateService service;

    @GetMapping
    public List<RelationShipCateResponse> getAll() {
        return service.getAll();
    }

    @PostMapping
    public RelationShipCateResponse create(@RequestBody RelationShipCateRequest request) {
        return service.create(request);
    }
}

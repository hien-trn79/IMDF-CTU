package com.example.backend_imdf_ctu.controller;

import com.example.backend_imdf_ctu.dto.request.IndoorRouteRequest;
import com.example.backend_imdf_ctu.dto.response.IndoorRouteResponse;
import com.example.backend_imdf_ctu.service.IndoorRouteService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/indoor-routes")
@RequiredArgsConstructor
public class IndoorRouteController {

    private final IndoorRouteService service;

    // [GET] /api/indoor-routes/
    @GetMapping
    public List<IndoorRouteResponse> getAll() {
        return service.getAll();
    }

    // [GET] /api/indoor-routes/{indoorRouteId}
    @GetMapping("/{indoorRouteId}")
    public IndoorRouteResponse getById(@PathVariable UUID indoorRouteId) {
        return service.getById(indoorRouteId);
    }

    // [POST] /api/indoor-routes/
    @PostMapping
    public IndoorRouteResponse create(@RequestBody IndoorRouteRequest request) {
        return service.create(request);
    }

    // [PUT] /api/indoor-routes/{indoorRouteId}
    @PutMapping("/{indoorRouteId}")
    public IndoorRouteResponse update(
        @PathVariable UUID indoorRouteId,
        @RequestBody IndoorRouteRequest request) {
        return service.update(indoorRouteId, request);
    }

    // [DELETE] /api/indoor-routes/{indoorRouteId}
    @DeleteMapping("/{indoorRouteId}")
    public Boolean delete(@PathVariable UUID indoorRouteId) {
        if(service.getById(indoorRouteId) != null) {
            service.delete(indoorRouteId);
            return true;
        }
        return false;
    }
}

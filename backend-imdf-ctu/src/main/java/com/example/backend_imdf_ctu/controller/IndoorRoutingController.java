package com.example.backend_imdf_ctu.controller;

import com.example.backend_imdf_ctu.dto.geojson.GeoJsonFeatureCollection;
import com.example.backend_imdf_ctu.dto.request.IndoorShortestPathRequest;
import com.example.backend_imdf_ctu.dto.response.IndoorShortestPathResponse;
import com.example.backend_imdf_ctu.service.interfaces.IndoorRoutingService;
import com.example.backend_imdf_ctu.repository.IndoorRouteRepository;
import com.example.backend_imdf_ctu.repository.NetworkNodesRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/shortest-path")
@CrossOrigin
@RequiredArgsConstructor
public class IndoorRoutingController {
    private final IndoorRoutingService service;

    @PostMapping
    public ResponseEntity<GeoJsonFeatureCollection> getShortestPath(@RequestBody IndoorShortestPathRequest request) {
        GeoJsonFeatureCollection response = service.getShortestPath(request);
        return ResponseEntity.ok(response);
    }

}

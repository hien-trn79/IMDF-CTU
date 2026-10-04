package com.example.backend_imdf_ctu.controller;

import com.example.backend_imdf_ctu.dto.request.NetworkEdgesRequest;
import com.example.backend_imdf_ctu.dto.response.NetworkEdgesResponse;
import com.example.backend_imdf_ctu.service.interfaces.NetworkEdgesService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/network-edges")
@RequiredArgsConstructor
@CrossOrigin
public class NetworkEdgesController {
    private final NetworkEdgesService service;

    // [GET] /network-edges
    @GetMapping
    public List<NetworkEdgesResponse> getAll() {
        return service.getAll();
    }

    // [GET] /network-edges/{id}
    @GetMapping("/{id}")
    public NetworkEdgesResponse getById(@PathVariable Integer id) {
        return service.getById(id);
    }

    // [POST] /network-edges
    @PostMapping
    public NetworkEdgesResponse create(
        @RequestBody NetworkEdgesRequest request
        ) {
        return service.create(request);
    }

    // [POST] /network-edges/batch
    @PostMapping("/batch")
    public Integer createBatch(
        @RequestBody List<NetworkEdgesRequest> requests
    ) {
        return requests.stream()
            .map(service::create)
            .toList()
            .size();
    }

    // [PUT] /network-edges/{id}
    @PutMapping("/{id}")
    public NetworkEdgesResponse update(
        @PathVariable Integer id,
        @RequestBody NetworkEdgesRequest request
    ) {
        return service.update(id, request);
    }

    // [DELETE] /network-edges/{id}
    @DeleteMapping("/{id}")
    public Boolean delete(@PathVariable Integer id) {
        return service.delete(id);
    }
}


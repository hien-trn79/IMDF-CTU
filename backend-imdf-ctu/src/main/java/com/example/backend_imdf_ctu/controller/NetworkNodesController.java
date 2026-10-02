package com.example.backend_imdf_ctu.controller;

import com.example.backend_imdf_ctu.dto.request.NetworkNodesRequest;
import com.example.backend_imdf_ctu.dto.response.NetworkNodesResponse;
import com.example.backend_imdf_ctu.service.NetworkNodesService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/network-nodes")
@RequiredArgsConstructor
@CrossOrigin
public class NetworkNodesController {

    private final NetworkNodesService service;

    // [GET] /network-nodes
    @GetMapping
    public List<NetworkNodesResponse> getAll() {
        return service.getAll();
    }

    // [GET] /network-nodes/{id}
    @GetMapping("/{id}")
    public NetworkNodesResponse getById(Integer id) {
        return service.getById(id);
    }

    // [POST] /network-nodes
    @PostMapping
    public NetworkNodesResponse create(@RequestBody NetworkNodesRequest request) {
        return service.create(request);
    }

    // [POST] /network-nodes/batch
    // add list of network nodes
    @PostMapping("/batch")
    public Integer createBatch(
        @RequestBody List<NetworkNodesRequest> requests) {
        return requests.stream()
            .map(service::create)
            .toList()
            .size();
    }

    // [PUT] /network-nodes/{id}
    @PutMapping("/{id}")
    public NetworkNodesResponse update(
        @PathVariable Integer id,
        @RequestBody NetworkNodesRequest request
    ) {
        return service.update(id, request);
    }

    // [DELETE] /network-nodes/{id}
    @DeleteMapping("/{id}")
    public Boolean delete(@PathVariable Integer id) {
        return service.delete(id);
    }
}

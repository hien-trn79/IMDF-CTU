package com.example.backend_imdf_ctu.controller;

import com.example.backend_imdf_ctu.dto.request.GridLineRequest;
import com.example.backend_imdf_ctu.dto.response.GridLineResponse;
import com.example.backend_imdf_ctu.service.interfaces.GridLineService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/grid-lines")
@RequiredArgsConstructor
@CrossOrigin
public class GridLineController {

    private final GridLineService service;

    // [GET] /grid-lines
    @GetMapping
    public List<GridLineResponse> getAll() {
        return service.getAll();
    }

    // [GET] /grid-lines/{gridLineId}
    @GetMapping("/{gridLineId}")
    public GridLineResponse getById(@PathVariable Integer gridLineId) {
        return service.getById(gridLineId);
    }

    // [POST] /grid-lines
    @PostMapping
    public GridLineResponse create(@RequestBody GridLineRequest request) {
        return service.create(request);
    }

    // add list of grid lines
    @PostMapping("/batch")
    public Integer createBatch(@RequestBody List<GridLineRequest> requests) {
        return requests.stream()
            .map(service::create)
            .toList()
            .size();
    }


    // [PUT] /grid-lines/{gridLineId}
    @PutMapping("/{gridLineId}")
    public GridLineResponse update(
        @PathVariable Integer gridLineId,
        @RequestBody GridLineRequest request
    ) {
        return service.update(gridLineId, request);
    }

    // [DELETE] /grid-lines/{gridLineId}
    @DeleteMapping("/{gridLineId}")
    public Boolean delete(@PathVariable Integer gridLineId) {
        return service.delete(gridLineId);
    }
}

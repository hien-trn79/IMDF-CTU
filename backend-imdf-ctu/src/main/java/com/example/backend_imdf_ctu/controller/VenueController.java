package com.example.backend_imdf_ctu.controller;

import com.example.backend_imdf_ctu.dto.request.VenueRequest;
import com.example.backend_imdf_ctu.dto.response.VenueResponse;
import com.example.backend_imdf_ctu.service.interfaces.VenueService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/venues")
@CrossOrigin
@RequiredArgsConstructor
public class VenueController {

    private final VenueService service;

    // [POST] /venues
    @PostMapping
    public VenueResponse create(@RequestBody VenueRequest request) {
        return service.create(request);
    }

    // [GET] /venues/{id}
    @GetMapping("/{id}")
    public VenueResponse getById(@PathVariable Integer id) {
        return service.getById(id);
    }

    // [PUT] /venues/{id}
    @PutMapping("/{id}")
    public VenueResponse update(
        @PathVariable Integer id,
        @RequestBody VenueRequest request
    ) {
        return service.update(id, request);
    }

    // [DELETE] /venues/{id}
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Integer id) {
        service.delete(id);
    }


}

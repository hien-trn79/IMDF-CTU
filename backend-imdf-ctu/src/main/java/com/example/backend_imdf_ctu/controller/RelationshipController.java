package com.example.backend_imdf_ctu.controller;

import com.example.backend_imdf_ctu.dto.request.RelationShipRequest;
import com.example.backend_imdf_ctu.dto.response.RelationShipResponse;
import com.example.backend_imdf_ctu.service.interfaces.RelationShipService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/relationships")
@CrossOrigin
@RequiredArgsConstructor
public class RelationshipController {

    private final RelationShipService service;

    // [GET] /relationships
    @GetMapping
    public List<RelationShipResponse> getAll() {
        return service.getAll();
    }

    // [GET] /relationships/{id}
    @GetMapping("/{id}")
    public RelationShipResponse getById(@PathVariable Integer id) {
        return service.getById(id);
    }

    // [POST] /relationships
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RelationShipResponse create(
        @Valid @RequestBody RelationShipRequest request
    ) {
        return service.create(request);
    }

    // [PUT] /relationships/{id}
    @PutMapping("/{id}")
    public RelationShipResponse update(
        @PathVariable Integer id,
        @Valid @RequestBody RelationShipRequest request
    ) {
        return service.update(id, request);
    }

    // [DELETE] /relationships/{id}
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Integer id) {
        service.delete(id);
    }

}

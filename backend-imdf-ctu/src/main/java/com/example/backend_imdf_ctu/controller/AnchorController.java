package com.example.backend_imdf_ctu.controller;

import com.example.backend_imdf_ctu.dto.request.AnchorRequest;
import com.example.backend_imdf_ctu.dto.response.AnchorResponse;
import com.example.backend_imdf_ctu.service.interfaces.AnchorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/anchors")
@CrossOrigin
@RequiredArgsConstructor
public class AnchorController {

    private final AnchorService service;

    // [GET] /anchors
    @GetMapping
    public Page<AnchorResponse> getAll(Pageable pageable) {
        return service.getAll(pageable);
    }

    // [GET] /anchors/{id}
    @GetMapping("/{id}")
    public AnchorResponse getById(@PathVariable Integer id) {
        return service.getById(id);
    }

    // [POST] /anchors
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AnchorResponse create(@Valid @RequestBody AnchorRequest request) {
        return service.create(request);
    }

    // [PUT] /anchors/{id}
    @PutMapping("/{id}")
    public AnchorResponse update(@PathVariable Integer id,@Valid @RequestBody AnchorRequest request) {
        return service.update(id, request);
    }

    // [DELETE] /anchors/{id}
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Integer id) {
        service.delete(id);
    }
}

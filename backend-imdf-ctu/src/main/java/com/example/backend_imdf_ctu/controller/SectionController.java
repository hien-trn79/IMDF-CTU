package com.example.backend_imdf_ctu.controller;

import com.example.backend_imdf_ctu.dto.request.SectionRequest;
import com.example.backend_imdf_ctu.dto.response.SectionResponse;
import com.example.backend_imdf_ctu.service.interfaces.SectionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/sections")
@CrossOrigin
@RequiredArgsConstructor
public class SectionController {
    private final SectionService service;

    // [GET] /sections?page=0&size=10
    @GetMapping
    public Page<SectionResponse> getAll(Pageable pageable) {
        return service.getAll(pageable);
    }

    // [GET] /sections/{id}
    @GetMapping("/{id}")
    public SectionResponse getById(@PathVariable Integer id) {
        return service.getById(id);
    }

    // [POST] /sections
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SectionResponse create(@Valid @RequestBody SectionRequest request) {
        return service.create(request);
    }

    // [PUT] /sections/{id}
    @PutMapping("/{id}")
    public SectionResponse update(@PathVariable Integer id, @Valid @RequestBody SectionRequest request
    ) {
        return service.update(id, request);
    }

    // [DELETE] /sections/{id}
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Integer id) {
        service.delete(id);
    }
}

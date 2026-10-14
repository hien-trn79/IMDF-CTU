package com.example.backend_imdf_ctu.controller;

import com.example.backend_imdf_ctu.dto.request.OpeningRequest;
import com.example.backend_imdf_ctu.dto.response.OpeningResponse;
import com.example.backend_imdf_ctu.service.interfaces.OpeningService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/openings")
@CrossOrigin
@RequiredArgsConstructor
public class OpeningController {

    private final OpeningService service;

    // [GET] /openings
    @GetMapping
    public Page<OpeningResponse> getAll(Pageable pageable) {
        return service.getAll(pageable);
    }

    // [GET] /openings/{id}
    @GetMapping("/{id}")
    public OpeningResponse getById(@PathVariable Integer id) {
        return service.getById(id);
    }

    // [POST] /openings
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OpeningResponse create(@Valid @RequestBody OpeningRequest request) {
        return service.create(request);
    }

    // [PUT] /openings/{id}
    @PutMapping("/{id}")
    public OpeningResponse update(@PathVariable Integer id, @Valid @RequestBody OpeningRequest request) {
        return service.update(id, request);
    }

    // [DELETE] /openings/{id}
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Integer id) {
        service.delete(id);
    }
}

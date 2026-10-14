package com.example.backend_imdf_ctu.controller;

import com.example.backend_imdf_ctu.dto.request.LevelRequest;
import com.example.backend_imdf_ctu.dto.response.LevelResponse;
import com.example.backend_imdf_ctu.service.interfaces.LevelService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/levels")
@CrossOrigin
@RequiredArgsConstructor
public class LevelController {

    private final LevelService service;

    // [GET] /levels
    @GetMapping
    public Page<LevelResponse> getAll(Pageable pageable) {
         return service.list(pageable);
    }

    // [GET] /levels/{id}
    @GetMapping("/{id}")
    public LevelResponse getById(@PathVariable Integer id) {
        return service.getById(id);
    }

    // [POST] /levels
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LevelResponse create(@Valid @RequestBody LevelRequest request) {
        return service.create(request);
    }

    // [PUT] /levels/{id}
    @PutMapping("/{id}")
    public LevelResponse update(
        @PathVariable Integer id,
        @Valid @RequestBody LevelRequest request
    ) {
        return service.update(id, request);
    }

    // [DELETE] /levels/{id}
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Integer id) {
        service.delete(id);
    }
}

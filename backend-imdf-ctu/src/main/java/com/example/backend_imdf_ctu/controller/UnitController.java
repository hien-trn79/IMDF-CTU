package com.example.backend_imdf_ctu.controller;

import com.example.backend_imdf_ctu.dto.request.UnitRequest;
import com.example.backend_imdf_ctu.dto.response.UnitResponse;
import com.example.backend_imdf_ctu.service.interfaces.UnitService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/units")
@CrossOrigin
@RequiredArgsConstructor
public class UnitController {

    private final UnitService service;

//    // [GET] /units
    @GetMapping
    public Page<UnitResponse> getAll(
        @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.ASC)
        Pageable pageable) {
        return service.getAll(pageable);
    }
//
    // [GET] /units/{id}
    @GetMapping("/{id}")
    public UnitResponse getById(@PathVariable Integer id) {
        return service.getById(id);
    }

    // [GET] /units?levelId={levelId}
    @GetMapping(params = "levelId")
    public Page<UnitResponse> getAllByLevelId(
        @RequestParam Integer levelId,
        @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.ASC)
        Pageable pageable) {
        return service.getAllByLevelId(levelId)
                .stream()
                .sorted((u1, u2) -> u1.getId().compareTo(u2.getId())) // Sort by ID in ascending order
                .collect(java.util.stream.Collectors.collectingAndThen(java.util.stream.Collectors.toList(), list -> {
                    int start = (int) pageable.getOffset();
                    int end = Math.min((start + pageable.getPageSize()), list.size());
                    return new org.springframework.data.domain.PageImpl<>(list.subList(start, end), pageable, list.size());
                }));
    }

    // [POST] /units
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UnitResponse create(@Valid @RequestBody UnitRequest request) {
        return service.create(request);
    }
//
//    // [PUT] /units/{id}
//    @PutMapping("/{id}")
//    public UnitResponse update(@PathVariable Integer id, @Valid @RequestBody UnitRequest request) {
//        return service.update(id, request);
//    }
//
//    // [DELETE] /units/{id}
//    @DeleteMapping("/{id}")
//    @ResponseStatus(HttpStatus.NO_CONTENT)
//    public void delete(@PathVariable Integer id) {
//        service.delete(id);
//    }
}

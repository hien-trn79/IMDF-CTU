package com.example.backend_imdf_ctu.controller;

import com.example.backend_imdf_ctu.dto.request.AddressRequest;
import com.example.backend_imdf_ctu.dto.response.AddressResponse;
import com.example.backend_imdf_ctu.service.interfaces.AddressService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/addresses")
@RequiredArgsConstructor
@CrossOrigin
public class AddressController {
    private final AddressService service;

    // [GET] /addresses
    @GetMapping
    public List<AddressResponse> getAll() {
         return service.getAll();
    }

    // [GET] /addresses/{id}
    @GetMapping("/{id}")
    public AddressResponse getById(@PathVariable Integer id) {
        return service.getById(id);
    }

    // [POST] /addresses
    @PostMapping
    public AddressResponse create(@RequestBody AddressRequest request) {
        return service.create(request);
    }

    // [PUT] /addresses/{id}
    @PutMapping("/{id}")
    public AddressResponse update(
        @PathVariable Integer id,
        @RequestBody AddressRequest request) {
        return service.update(id, request);
    }

    // [DELETE] /addresses/{id}
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Integer id) {
        service.delete(id);
    }
}

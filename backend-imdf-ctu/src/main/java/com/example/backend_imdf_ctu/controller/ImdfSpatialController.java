package com.example.backend_imdf_ctu.controller;

import com.example.backend_imdf_ctu.dto.request.ImdfNormalizeRequest;
import com.example.backend_imdf_ctu.dto.response.ImdfNormalizeResponse;
import com.example.backend_imdf_ctu.service.interfaces.ImdfSpatialService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/spatial")
@CrossOrigin
@RequiredArgsConstructor
public class ImdfSpatialController {

    private final ImdfSpatialService imdfSpatialService;

    @PostMapping("/normalize-imdf")
    public ResponseEntity<ImdfNormalizeResponse> normalizeImdf(@RequestBody ImdfNormalizeRequest request) {
        ImdfNormalizeResponse response = imdfSpatialService.normalizeAndValidate(request);
        return ResponseEntity.ok(response);
    }
}

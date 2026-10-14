package com.example.backend_imdf_ctu.service.interfaces;

import com.example.backend_imdf_ctu.dto.request.VenueRequest;
import com.example.backend_imdf_ctu.dto.response.VenueResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface VenueService {
    VenueResponse create(VenueRequest request);
    VenueResponse getById(Integer id);
    Page<VenueResponse> list(Pageable pageable);
    VenueResponse update(Integer id, VenueRequest request);
    void delete(Integer id);
}

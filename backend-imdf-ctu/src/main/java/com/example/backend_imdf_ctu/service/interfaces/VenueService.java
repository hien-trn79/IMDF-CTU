package com.example.backend_imdf_ctu.service.interfaces;

import com.example.backend_imdf_ctu.dto.request.VenueRequest;
import com.example.backend_imdf_ctu.dto.response.VenueResponse;
import com.example.backend_imdf_ctu.entity.Venue;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface VenueService {
    Venue create(VenueRequest request);
    Venue getById(Integer id);
    List<Venue> getAll();
    Venue update(Integer id, VenueRequest request);
    void delete(Integer id);
}

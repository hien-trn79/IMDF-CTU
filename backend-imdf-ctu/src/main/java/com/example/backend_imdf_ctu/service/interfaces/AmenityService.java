package com.example.backend_imdf_ctu.service.interfaces;

import com.example.backend_imdf_ctu.dto.request.AmenityRequest;
import com.example.backend_imdf_ctu.dto.response.AmenityResponse;
import com.example.backend_imdf_ctu.entity.Amenity;

import java.util.List;

public interface AmenityService {
    List<Amenity> getAll(Integer unitLevelId);

    Amenity getById(Integer id);

    Amenity create(AmenityRequest request);

    Amenity update(Integer id, AmenityRequest request);

    void delete(Integer id);
}

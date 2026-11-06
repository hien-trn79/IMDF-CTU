package com.example.backend_imdf_ctu.service.interfaces;

import com.example.backend_imdf_ctu.dto.request.BuildingRequest;
import com.example.backend_imdf_ctu.dto.response.BuildingResponse;
import com.example.backend_imdf_ctu.entity.Building;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface BuildingService {
    Building create(BuildingRequest request);

    Building getById(Integer id);

    List<Building> getAll(Integer venueId);

    Building update(Integer id, BuildingRequest request);

    void delete(Integer id);
}

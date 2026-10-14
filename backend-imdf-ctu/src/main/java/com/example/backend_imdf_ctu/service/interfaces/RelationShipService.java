package com.example.backend_imdf_ctu.service.interfaces;

import com.example.backend_imdf_ctu.dto.request.RelationShipRequest;
import com.example.backend_imdf_ctu.dto.response.RelationShipResponse;

import java.util.List;

public interface RelationShipService {
   List<RelationShipResponse> getAll();

    RelationShipResponse create(RelationShipRequest request);

    RelationShipResponse getById(Integer id);

    RelationShipResponse update(Integer id, RelationShipRequest request);

    void delete(Integer id);
}

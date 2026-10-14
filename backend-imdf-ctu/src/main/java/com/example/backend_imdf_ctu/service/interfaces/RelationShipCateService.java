package com.example.backend_imdf_ctu.service.interfaces;

import com.example.backend_imdf_ctu.dto.request.RelationShipCateRequest;
import com.example.backend_imdf_ctu.dto.response.RelationShipCateResponse;

import java.util.List;

public interface RelationShipCateService {

    List<RelationShipCateResponse> getAll();

    RelationShipCateResponse create(RelationShipCateRequest request);
}

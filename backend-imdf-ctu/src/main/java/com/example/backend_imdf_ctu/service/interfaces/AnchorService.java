package com.example.backend_imdf_ctu.service.interfaces;

import com.example.backend_imdf_ctu.dto.request.AnchorRequest;
import com.example.backend_imdf_ctu.entity.Anchor;

import java.util.List;

public interface AnchorService {
    List<Anchor> getAllByUnitLevelId(Integer unitLevelId);

    Anchor getById(Integer id);

    Anchor create(AnchorRequest request);

    Anchor update(Integer id, AnchorRequest request);

    void delete(Integer id);
}

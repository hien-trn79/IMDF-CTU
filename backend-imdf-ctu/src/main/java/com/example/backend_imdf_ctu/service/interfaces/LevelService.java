package com.example.backend_imdf_ctu.service.interfaces;

import com.example.backend_imdf_ctu.dto.request.LevelRequest;
import com.example.backend_imdf_ctu.entity.Level;

import java.util.List;

public interface LevelService {
    Level create(LevelRequest request);

    Level getById(Integer id);

    List<Level> getAll(Integer buildingId);

    Level update(Integer id, LevelRequest request);

    void delete(Integer id);
}

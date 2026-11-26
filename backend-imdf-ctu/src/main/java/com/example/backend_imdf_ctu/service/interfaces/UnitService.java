package com.example.backend_imdf_ctu.service.interfaces;

import com.example.backend_imdf_ctu.dto.request.UnitRequest;
import com.example.backend_imdf_ctu.entity.Unit;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface UnitService {

    List<Unit> getAll();

    List<Unit> getAllByLevelId(Integer levelId);

    Unit getById(Integer id);

    Unit create(UnitRequest request);

    Unit update(Integer id, UnitRequest request);

    void delete(Integer id);
}

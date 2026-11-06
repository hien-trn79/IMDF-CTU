package com.example.backend_imdf_ctu.service.interfaces;

import com.example.backend_imdf_ctu.dto.request.GridLineRequest;
import com.example.backend_imdf_ctu.entity.GridLine;

import java.util.List;

public interface GridLineService {

    List<GridLine> getAll(Integer levelId);

    GridLine getById(Integer gridLineId);

    GridLine create(GridLineRequest request);

    GridLine update(Integer gridLineId, GridLineRequest request);

    Boolean delete(Integer gridLineId);
}

package com.example.backend_imdf_ctu.service.implement;

import com.example.backend_imdf_ctu.dto.request.GridLineRequest;
import com.example.backend_imdf_ctu.entity.GridLine;
import com.example.backend_imdf_ctu.entity.IndoorRoute;
import com.example.backend_imdf_ctu.exception.BusinessException;
import com.example.backend_imdf_ctu.exception.ErrorCode;
import com.example.backend_imdf_ctu.mapper.GridLineMapper;
import com.example.backend_imdf_ctu.repository.GridLineRepository;
import com.example.backend_imdf_ctu.repository.IndoorRouteRepository;
import com.example.backend_imdf_ctu.service.interfaces.GridLineService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.PrecisionModel;
import org.locationtech.jts.io.WKBReader;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class GridLineServiceImpl implements GridLineService {

    private final GridLineRepository repository;
    private final GridLineMapper mapper;

    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
    private final WKBReader wkbReader = new WKBReader(geometryFactory);

    private final IndoorRouteRepository indoorRouteRepository;

    @Override
    public List<GridLine> getAll(Integer levelId) {
        return repository.findAllByIndoorRouteLevelId(levelId)
            .stream()
            .toList();
    }

    @Override
    public GridLine getById(Integer gridLineId) {
        return repository.findById(gridLineId)
            .orElseThrow(() -> new BusinessException(
                ErrorCode.GRID_LINE_NOT_FOUND
            ));
    }

    @Override
    public GridLine create(GridLineRequest request) {
        IndoorRoute indoorRoute = indoorRouteRepository.findById(request.getIndoorRouteId())
            .orElseThrow(() -> new BusinessException(
                ErrorCode.ROUTE_NOT_FOUND
            ));

        GridLine entity = mapper.toEntity(request, indoorRoute);

        return repository.save(entity);
    }

    @Override
    public GridLine update(Integer gridLineId, GridLineRequest request) {
        GridLine entity = repository.findById(gridLineId)
            .orElseThrow(() -> new BusinessException(
                ErrorCode.GRID_LINE_NOT_FOUND
            ));
        IndoorRoute indoorRoute = indoorRouteRepository.findById(request.getIndoorRouteId())
            .orElseThrow(() -> new BusinessException(
                ErrorCode.ROUTE_NOT_FOUND
            ));

        mapper.updateEntity(
            entity,
            request,
            indoorRoute
        );

        return repository.save(entity);
    }

    @Override
    public Boolean delete(Integer gridLineId) {
        // Check if the entity exists by ID, or throw an exception if not found
        GridLine entity = repository.findById(gridLineId)
            .orElseThrow(() -> new BusinessException(
                ErrorCode.GRID_LINE_NOT_FOUND
            ));
        // Delete the entity from the repository
        if (entity != null) {
            repository.delete(entity);
            return true;
        }
        return false;
    }
}

package com.example.backend_imdf_ctu.implement;

import com.example.backend_imdf_ctu.dto.request.GridLineRequest;
import com.example.backend_imdf_ctu.dto.response.GridLineResponse;
import com.example.backend_imdf_ctu.entity.GridLine;
import com.example.backend_imdf_ctu.entity.IndoorRoute;
import com.example.backend_imdf_ctu.exception.BusinessException;
import com.example.backend_imdf_ctu.exception.ErrorCode;
import com.example.backend_imdf_ctu.mapper.GridLineMapper;
import com.example.backend_imdf_ctu.repository.GridLineRepository;
import com.example.backend_imdf_ctu.repository.IndoorRouteRepository;
import com.example.backend_imdf_ctu.service.GridLineService;
import com.example.backend_imdf_ctu.service.IndoorRouteService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.LineString;
import org.locationtech.jts.geom.PrecisionModel;
import org.locationtech.jts.io.WKBReader;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

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
    public List<GridLineResponse> getAll() {
        return repository.findAll()
            .stream()
            .map(mapper::toResponse)
            .toList();
    }

    @Override
    public GridLineResponse getById(Integer gridLineId) {
        return repository.findById(gridLineId)
            .map(mapper::toResponse)
            .orElseThrow(() -> new BusinessException(
                ErrorCode.GRID_LINE_NOT_FOUND
            ));
    }

    @Override
    public GridLineResponse create(GridLineRequest request) {
        // Convert chuỗi Hex String sang JTS LineString
        LineString lineString;
        try {
            byte[] bytes = WKBReader.hexToBytes(request.getGeom());
            lineString = (LineString) wkbReader.read(bytes);
            lineString.setSRID(4326); // Đảm bảo SRID là 4326
        } catch (Exception e) {
            throw new IllegalArgumentException("Định dạng geom WKB Hex không hợp lệ: " + e.getMessage());
        }

        GridLine entity = mapper.toEntity(request);
        entity.setGeom(lineString);

        // Fetch the IndoorRoute entity based on the provided indoorRouteId
        IndoorRoute indoorRoute = indoorRouteRepository.findById(request.getIndoorRouteId())
            .orElseThrow(() -> new BusinessException(
                ErrorCode.ROUTE_NOT_FOUND,
                "Không tìm thấy đường đi trong nhà với ID: " + request.getIndoorRouteId()
            ));
        entity.setIndoorRoute(indoorRoute);

        return mapper.toResponse(repository.save(entity));
    }

    @Override
    public GridLineResponse update(Integer gridLineId, GridLineRequest request) {
        // Find the existing entity by ID, or throw an exception if not found
        GridLine entity = repository.findById(gridLineId)
            .orElseThrow(() -> new BusinessException(
                ErrorCode.GRID_LINE_NOT_FOUND
            ));
        // Update the entity with the new values from the request
        return mapper.toResponse(repository.save(entity));
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

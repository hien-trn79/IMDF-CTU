package com.example.backend_imdf_ctu.service.implement;

import com.example.backend_imdf_ctu.dto.request.IndoorRouteRequest;
import com.example.backend_imdf_ctu.dto.response.IndoorRouteResponse;
import com.example.backend_imdf_ctu.entity.IndoorRoute;
import com.example.backend_imdf_ctu.entity.Level;
import com.example.backend_imdf_ctu.exception.BusinessException;
import com.example.backend_imdf_ctu.exception.ErrorCode;
import com.example.backend_imdf_ctu.mapper.IndoorRouteMapper;
import com.example.backend_imdf_ctu.repository.IndoorRouteRepository;
import com.example.backend_imdf_ctu.repository.LevelRepository;
import com.example.backend_imdf_ctu.service.interfaces.IndoorRouteService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class IndoorRouteServiceImpl implements IndoorRouteService {

    private final IndoorRouteRepository repository;
    private final IndoorRouteMapper mapper;

    private final LevelRepository levelRepository;

    @Override
    public List<IndoorRouteResponse> getAll(Integer levelId) {
        log.info("Retrieving all indoor routes");
        // retrieve all indoor routes from the repository and convert them to response DTOs using the mapper
        return repository.findAllByLevelId(levelId)
            .stream()
            .map(mapper::toResponse)
            .toList();
    }

    @Override
    public IndoorRouteResponse getById(Integer indoorRouteId) {
        // find the indoor route by ID and convert it to a response DTO using the mapper
        return repository.findById(indoorRouteId)
            .map(mapper::toResponse)
            .orElseThrow(() -> new BusinessException(
                ErrorCode.ROUTE_NOT_FOUND,
                "Không tìm thấy đường đi trong nhà với ID: " + indoorRouteId
            ));
    }

    @Override
    public IndoorRouteResponse create(IndoorRouteRequest request) {
        Level level = levelRepository.findById(request.getLevelId())
            .orElseThrow(() -> new BusinessException(
                ErrorCode.LEVEL_NOT_FOUND,
                "Không tìm thấy tầng với ID: " + request.getLevelId()
            ));


        // convert request DTO to entity using the mapper
        IndoorRoute indoorRoute = mapper.toEntity(request, level);

        // save the entity to the database
        IndoorRoute savedIndoorRoute = repository.save(indoorRoute);

        return mapper.toResponse(savedIndoorRoute);
    }

    @Override
    public IndoorRouteResponse update(Integer indoorRouteId, IndoorRouteRequest request) {
        Level level = levelRepository.findById(request.getLevelId())
            .orElseThrow(() -> new BusinessException(
                ErrorCode.LEVEL_NOT_FOUND,
                "Không tìm thấy tầng với ID: " + request.getLevelId()
            ));

        IndoorRoute indoorRoute = repository.findById(indoorRouteId)
            .orElseThrow(() -> new BusinessException(
                ErrorCode.ROUTE_NOT_FOUND,
                "Không tìm thấy đường đi trong nhà với ID: " + indoorRouteId
            ));

        // update entity fields using the mapper
        mapper.updateEntity(indoorRoute, request, level);

        // save the updated entity
        IndoorRoute updatedIndoorRoute = repository.save(indoorRoute);

        return mapper.toResponse(updatedIndoorRoute);
    }

    @Override
    public void delete(Integer indoorRouteId) {
        IndoorRoute indoorRoute = repository.findById(indoorRouteId)
            .orElseThrow(() -> new BusinessException(
                ErrorCode.ROUTE_NOT_FOUND,
                "Không tìm thấy đường đi trong nhà với ID: " + indoorRouteId
            ));
        repository.delete(indoorRoute);
    }
}

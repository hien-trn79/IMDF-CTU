package com.example.backend_imdf_ctu.service.implement;

import com.example.backend_imdf_ctu.dto.request.NetworkNodesRequest;
import com.example.backend_imdf_ctu.dto.response.NetworkNodesResponse;
import com.example.backend_imdf_ctu.entity.IndoorRoute;
import com.example.backend_imdf_ctu.entity.NetworkNodes;
import com.example.backend_imdf_ctu.exception.BusinessException;
import com.example.backend_imdf_ctu.exception.ErrorCode;
import com.example.backend_imdf_ctu.mapper.NetworkNodesMapper;
import com.example.backend_imdf_ctu.repository.IndoorRouteRepository;
import com.example.backend_imdf_ctu.repository.NetworkNodesRepository;
import com.example.backend_imdf_ctu.service.interfaces.NetworkNodesService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NetworkNodesServiceImpl implements NetworkNodesService {

    private final NetworkNodesRepository repository;
    private final NetworkNodesMapper mapper;

    private final IndoorRouteRepository indoorRouteRepository;

    @Override
    public List<NetworkNodesResponse> getAll() {
        return repository.findAll()
            .stream()
            .map(mapper::toResponse)
            .toList();
    }

    @Override
    public NetworkNodesResponse getById(Integer id) {
        return repository.findById(id)
            .map(mapper::toResponse)
            .orElseThrow(() -> new
                BusinessException(ErrorCode.NETWORK_NODES_NOT_FOUND)
            );
    }

    @Override
    public NetworkNodesResponse create(NetworkNodesRequest request) {
        // Tim kiem IndoorRoute theo indoorRouteId
        IndoorRoute indoorRoute = indoorRouteRepository.findById(request.getIndoorRouteId())
            .orElseThrow(() -> new BusinessException(ErrorCode.NETWORK_NODES_NOT_FOUND));

        NetworkNodes entity = mapper.toEntity(request, indoorRoute);

        return mapper.toResponse(repository.save(entity));
    }
    
    @Override
    public NetworkNodesResponse update(
        Integer id,
        NetworkNodesRequest request
    ) {
        NetworkNodes entity = repository.findById(id)
            .orElseThrow(() -> new BusinessException(ErrorCode.NETWORK_NODES_NOT_FOUND));
        
        IndoorRoute indoorRoute = indoorRouteRepository.findById(request.getIndoorRouteId())
            .orElseThrow(() -> new BusinessException(ErrorCode.NETWORK_NODES_NOT_FOUND));
        
        mapper.updateEntity(entity, request, indoorRoute);

        return mapper.toResponse(repository.save(entity));
    }

    @Override
    public Boolean delete(Integer id) {
        if (!repository.existsById(id)) {
            throw new BusinessException(ErrorCode.NETWORK_NODES_NOT_FOUND);
        }
        repository.deleteById(id);
        return true;
    }
}


package com.example.backend_imdf_ctu.service.implement;

import com.example.backend_imdf_ctu.dto.request.NetworkEdgesRequest;
import com.example.backend_imdf_ctu.dto.response.NetworkEdgesResponse;
import com.example.backend_imdf_ctu.entity.IndoorRoute;
import com.example.backend_imdf_ctu.entity.NetworkEdges;
import com.example.backend_imdf_ctu.entity.NetworkNodes;
import com.example.backend_imdf_ctu.exception.BusinessException;
import com.example.backend_imdf_ctu.exception.ErrorCode;
import com.example.backend_imdf_ctu.mapper.NetworkEdgesMapper;
import com.example.backend_imdf_ctu.repository.IndoorRouteRepository;
import com.example.backend_imdf_ctu.repository.NetworkEdgesRepository;
import com.example.backend_imdf_ctu.repository.NetworkNodesRepository;
import com.example.backend_imdf_ctu.service.interfaces.NetworkEdgesService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NetworkEdgesServiceImpl implements NetworkEdgesService {

    private final NetworkEdgesRepository repository;
    private final NetworkEdgesMapper mapper;

    private final IndoorRouteRepository indoorRouteRepository;

    private final NetworkNodesRepository nodesRepository;

    @Override
    public List<NetworkEdgesResponse> getAll() {
        return repository.findAll()
            .stream()
            .map(mapper::toResponse)
            .toList();
    }

    @Override
    public NetworkEdgesResponse getById(Integer id) {
        return repository.findById(id)
            .map(mapper::toResponse)
            .orElseThrow(() -> new BusinessException(ErrorCode.NETWORK_EDGES_NOT_FOUND));
    }

    @Override
    public NetworkEdgesResponse create(NetworkEdgesRequest request) {
        IndoorRoute indoorRoute = indoorRouteRepository.findById(request.getIndoorRouteId())
            .orElseThrow(() -> new BusinessException(ErrorCode.ROUTE_NOT_FOUND));

        // Find Source and Target nodes based on the provided IDs in the request
        NetworkNodes sourceNode = nodesRepository.findById(request.getSource())
            .orElseThrow(() -> new BusinessException(ErrorCode.NETWORK_NODES_NOT_FOUND));

        NetworkNodes targetNode = nodesRepository.findById(request.getTarget())
            .orElseThrow(() -> new BusinessException(ErrorCode.NETWORK_NODES_NOT_FOUND));

        NetworkEdges entity = mapper.toEntity(
            request,
            indoorRoute,
            sourceNode,
            targetNode
        );

        return mapper.toResponse(repository.save(entity));
    }

    @Override
    public NetworkEdgesResponse update(
        Integer id,
        NetworkEdgesRequest request
    ) {
        NetworkEdges existingEntity = repository.findById(id)
            .orElseThrow(() -> new BusinessException(ErrorCode.NETWORK_EDGES_NOT_FOUND));

        IndoorRoute indoorRoute = indoorRouteRepository.findById(request.getIndoorRouteId())
            .orElseThrow(() -> new BusinessException(ErrorCode.ROUTE_NOT_FOUND));

        // Find Source and Target nodes based on the provided IDs in the request
        NetworkNodes sourceNode = nodesRepository.findById(request.getSource())
            .orElseThrow(() -> new BusinessException(ErrorCode.NETWORK_NODES_NOT_FOUND));

        NetworkNodes targetNode = nodesRepository.findById(request.getTarget())
            .orElseThrow(() -> new BusinessException(ErrorCode.NETWORK_NODES_NOT_FOUND));

        NetworkEdges updatedEntity = mapper.toEntity(
            request,
            indoorRoute,
            sourceNode,
            targetNode
        );

        return mapper.toResponse(repository.save(updatedEntity));
    }

    @Override
    public Boolean delete(Integer id) {
        NetworkEdges existingEntity = repository.findById(id)
            .orElseThrow(() -> new BusinessException(ErrorCode.NETWORK_EDGES_NOT_FOUND));

        repository.delete(existingEntity);
        return true;
    }

}

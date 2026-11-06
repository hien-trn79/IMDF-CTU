package com.example.backend_imdf_ctu.service.interfaces;

import com.example.backend_imdf_ctu.dto.request.NetworkNodesRequest;
import com.example.backend_imdf_ctu.entity.NetworkNodes;

import java.util.List;

public interface NetworkNodesService {

    List<NetworkNodes> getAll(
        Integer routeId
    );

    NetworkNodes getById(Integer id);

    NetworkNodes create(NetworkNodesRequest request);

    NetworkNodes update(Integer id, NetworkNodesRequest request);

    Boolean delete(Integer id);
}

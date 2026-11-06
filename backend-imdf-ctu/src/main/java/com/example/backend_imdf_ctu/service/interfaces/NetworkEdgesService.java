package com.example.backend_imdf_ctu.service.interfaces;

import com.example.backend_imdf_ctu.dto.request.NetworkEdgesRequest;
import com.example.backend_imdf_ctu.entity.NetworkEdges;

import java.util.List;

public interface NetworkEdgesService {
    List<NetworkEdges> getAll(Integer routeId);

    NetworkEdges getById(Integer id);

    NetworkEdges create(NetworkEdgesRequest request);

    NetworkEdges update(Integer id, NetworkEdgesRequest request);

    Boolean delete(Integer id);
}

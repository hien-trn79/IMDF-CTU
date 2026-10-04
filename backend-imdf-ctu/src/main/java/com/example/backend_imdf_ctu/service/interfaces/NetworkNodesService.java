package com.example.backend_imdf_ctu.service.interfaces;

import com.example.backend_imdf_ctu.dto.request.NetworkNodesRequest;
import com.example.backend_imdf_ctu.dto.response.NetworkNodesResponse;

import java.util.List;

public interface NetworkNodesService {

    List<NetworkNodesResponse> getAll();

    NetworkNodesResponse getById(Integer id);

    NetworkNodesResponse create(NetworkNodesRequest request);

    NetworkNodesResponse update(Integer id, NetworkNodesRequest request);

    Boolean delete(Integer id);
}

package com.example.backend_imdf_ctu.service.interfaces;

import com.example.backend_imdf_ctu.dto.request.NetworkEdgesRequest;
import com.example.backend_imdf_ctu.dto.response.NetworkEdgesResponse;

import java.util.List;

public interface NetworkEdgesService {
    List<NetworkEdgesResponse> getAll();

    NetworkEdgesResponse getById(Integer id);

    NetworkEdgesResponse create(NetworkEdgesRequest request);

    NetworkEdgesResponse update(Integer id, NetworkEdgesRequest request);

    Boolean delete(Integer id);
}

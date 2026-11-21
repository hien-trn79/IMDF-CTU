package com.example.backend_imdf_ctu.service.interfaces;

import com.example.backend_imdf_ctu.dto.request.AddressRequest;
import com.example.backend_imdf_ctu.dto.response.AddressResponse;

import java.util.List;

public interface AddressService {

    List<AddressResponse> getAll();

    AddressResponse getById(Integer id);

    AddressResponse create(AddressRequest request);

    AddressResponse update(Integer id, AddressRequest request);

    void delete(Integer id);
}

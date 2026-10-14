package com.example.backend_imdf_ctu.service.implement;

import com.example.backend_imdf_ctu.dto.request.AddressRequest;
import com.example.backend_imdf_ctu.dto.response.AddressResponse;
import com.example.backend_imdf_ctu.entity.Address;
import com.example.backend_imdf_ctu.entity.Feature;
import com.example.backend_imdf_ctu.mapper.AddressMapper;
import com.example.backend_imdf_ctu.repository.AddressRepository;
import com.example.backend_imdf_ctu.repository.FeatureRepository;
import com.example.backend_imdf_ctu.service.interfaces.AddressService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AddressServiceImpl implements AddressService {

    private final AddressRepository repository;
    private final AddressMapper mapper;

    private final FeatureRepository featureRepository;

    @Override
    public List<AddressResponse> getAll() {
        return repository.findAll()
            .stream()
            .map(mapper::toResponse)
            .toList();
    }

    @Override
    public AddressResponse create(AddressRequest request) {
        Feature feature = featureRepository.findById(request.getFeatureId())
            .orElseThrow(() -> new RuntimeException("Feature not found"));

        Address entity = mapper.toEntity(request, feature);

        return mapper.toResponse(repository.save(entity));
    }
}

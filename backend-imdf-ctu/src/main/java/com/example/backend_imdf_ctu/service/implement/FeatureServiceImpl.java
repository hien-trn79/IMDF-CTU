package com.example.backend_imdf_ctu.service.implement;

import com.example.backend_imdf_ctu.dto.request.FeatureRequest;
import com.example.backend_imdf_ctu.dto.response.FeatureResponse;
import com.example.backend_imdf_ctu.entity.Feature;
import com.example.backend_imdf_ctu.mapper.FeatureMapper;
import com.example.backend_imdf_ctu.repository.FeatureRepository;
import com.example.backend_imdf_ctu.service.interfaces.FeatureService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FeatureServiceImpl implements FeatureService {

    private final FeatureRepository repository;
    private final FeatureMapper mapper;

    @Override
    public FeatureResponse create(FeatureRequest request) {
        Feature entity = mapper.toEntity(request);

        return mapper.toResponse(repository.save(entity));
    }

    @Override
    public List<FeatureResponse> getAll() {
        return repository.findAll()
            .stream()
            .map(mapper::toResponse)
            .toList();
    }
}


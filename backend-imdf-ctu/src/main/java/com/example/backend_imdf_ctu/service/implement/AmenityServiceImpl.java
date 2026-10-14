package com.example.backend_imdf_ctu.service.implement;

import com.example.backend_imdf_ctu.dto.request.AmenityRequest;
import com.example.backend_imdf_ctu.dto.response.AmenityResponse;
import com.example.backend_imdf_ctu.entity.Amenity;
import com.example.backend_imdf_ctu.entity.AmenityCategory;
import com.example.backend_imdf_ctu.entity.Feature;
import com.example.backend_imdf_ctu.mapper.AmenityMapper;
import com.example.backend_imdf_ctu.repository.AmenityCategoryRepository;
import com.example.backend_imdf_ctu.repository.AmenityRepository;
import com.example.backend_imdf_ctu.repository.FeatureRepository;
import com.example.backend_imdf_ctu.service.interfaces.AmenityService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AmenityServiceImpl implements AmenityService {

    private final AmenityRepository repository;
    private final AmenityMapper mapper;

    private final AmenityCategoryRepository amenityCategoryRepository;
    private final FeatureRepository featureRepository;

    public List<AmenityResponse> getAll() {
        return repository.findAll()
            .stream()
            .map(mapper::toResponse)
            .toList();
    }

    public AmenityResponse create(AmenityRequest request) {
        AmenityCategory category = amenityCategoryRepository.findById(request.getAmenityCategoryId())
                .orElseThrow(() -> new RuntimeException("Amenity category not found"));

        Feature feature = featureRepository.findById(request.getFeatureId())
                .orElseThrow(() -> new RuntimeException("Feature not found"));

        Amenity entity = mapper.toEntity(
            request,
            category,
            feature
        );

        return mapper.toResponse(repository.save(entity));
    }
}

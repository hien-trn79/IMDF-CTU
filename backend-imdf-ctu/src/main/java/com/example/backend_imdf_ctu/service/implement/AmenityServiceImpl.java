package com.example.backend_imdf_ctu.service.implement;

import com.example.backend_imdf_ctu.dto.request.AmenityRequest;
import com.example.backend_imdf_ctu.entity.*;
import com.example.backend_imdf_ctu.mapper.AmenityMapper;
import com.example.backend_imdf_ctu.repository.*;
import com.example.backend_imdf_ctu.service.interfaces.AmenityService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AmenityServiceImpl implements AmenityService {

    private final AmenityRepository repository;
    private final AmenityMapper mapper;

    private final UnitRepository unitRepository;
    private final AmenityCategoryRepository amenityCategoryRepository;
    private final FeatureRepository featureRepository;
    private final LevelRepository levelRepository;

    @Override
    public List<Amenity> getAll(Integer unitLevelId) {
        return repository.findAllByLevelId(unitLevelId)
            .stream()
            .toList();
    }

    @Override
    public Amenity create(AmenityRequest request) {
        Level level = levelRepository.findById(request.getLevelId())
            .orElseThrow(() -> new RuntimeException("Level not found"));

        AmenityCategory category = amenityCategoryRepository.findById(request.getAmenityCategoryId())
                .orElseThrow(() -> new RuntimeException("Amenity category not found"));

        Feature feature;
        if (request.getFeatureId() != null) {
            feature = featureRepository.findById(request.getFeatureId())
                    .orElseThrow(() -> new RuntimeException("Feature not found"));
        } else {
            feature = new Feature();
            feature.setFeatureId(UUID.randomUUID());
            feature.setFeatureType("amenity");
            featureRepository.save(feature);
        }

        Unit unit = unitRepository.findById(request.getUnitId())
                .orElseThrow(() -> new RuntimeException("Unit not found"));

        Amenity entity = mapper.toEntity(
            request,
            category,
            feature,
            unit,
            level
        );

        return repository.save(entity);
    }

    @Override
    public Amenity getById(Integer id) {
        return repository.findById(id)
            .orElseThrow(() -> new RuntimeException("Amenity not found"));
    }

    @Override
    public Amenity update(Integer id, AmenityRequest request) {
        Amenity existingAmenity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Amenity not found"));

        AmenityCategory category = amenityCategoryRepository.findById(request.getAmenityCategoryId())
                .orElseThrow(() -> new RuntimeException("Amenity category not found"));

        Feature feature;
        if (request.getFeatureId() != null) {
            feature = featureRepository.findById(request.getFeatureId())
                    .orElseThrow(() -> new RuntimeException("Feature not found"));
        } else {
            feature = new Feature();
            feature.setFeatureId(UUID.randomUUID());
            feature.setFeatureType("amenity");
            featureRepository.save(feature);
        }

        Unit unit = unitRepository.findById(request.getUnitId())
                .orElseThrow(() -> new RuntimeException("Unit not found"));

        Level level = levelRepository.findById(request.getLevelId())
                .orElseThrow(() -> new RuntimeException("Level not found"));

        mapper.updateEntity(
            existingAmenity,
            request,
            category,
            feature,
            unit,
            level);

        return repository.save(existingAmenity);
    }

    @Override
    public void delete(Integer id) {
        Amenity existingAmenity = repository.findById(id)
            .orElseThrow(() -> new RuntimeException("Amenity not found"));
        repository.delete(existingAmenity);
    }
}

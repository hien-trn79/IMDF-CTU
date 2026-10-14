package com.example.backend_imdf_ctu.service.implement;

import com.example.backend_imdf_ctu.dto.request.BuildingRequest;
import com.example.backend_imdf_ctu.dto.response.BuildingResponse;
import com.example.backend_imdf_ctu.entity.*;
import com.example.backend_imdf_ctu.exception.BusinessException;
import com.example.backend_imdf_ctu.exception.ErrorCode;
import com.example.backend_imdf_ctu.mapper.BuildingMapper;
import com.example.backend_imdf_ctu.mapper.GeometryConverter;
import com.example.backend_imdf_ctu.mapper.HistoryRecorder;
import com.example.backend_imdf_ctu.mapper.MultiPolygonNormalizer;
import com.example.backend_imdf_ctu.repository.*;
import com.example.backend_imdf_ctu.service.interfaces.BuildingService;
import lombok.RequiredArgsConstructor;
import org.locationtech.jts.geom.MultiPolygon;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class BuildingServiceImpl implements BuildingService {

    private final BuildingRepository repository;
    private final BuildingMapper mapper;

    private final BuildingCategoryRepository buildingCategoryRepository;
    private final FeatureRepository featureRepository;
    private final AddressRepository addressRepository;
    private final RestrictionCateRepository restrictionCateRepository;


    @Override
    @Transactional
    public BuildingResponse create(BuildingRequest request) {
        Feature feature = featureRepository.findById(request.getFeatureId())
            .orElseThrow(() -> new RuntimeException("Feature not found with id: " + request.getFeatureId()));

        Address address = addressRepository.findById(request.getAddressId())
            .orElseThrow(() -> new RuntimeException("Address not found with id: " + request.getAddressId()));

        RestrictionCategory restrictionCategory = restrictionCateRepository.findById(request.getRestrictionCategoryId())
            .orElseThrow(() -> new RuntimeException("Restriction Category not found with id: " + request.getRestrictionCategoryId()));

        BuildingCategory buildingCategory = buildingCategoryRepository.findById(request.getBuildingCategoryId())
            .orElseThrow(() -> new RuntimeException("Building Category not found with id: " + request.getBuildingCategoryId()));

        Building building = mapper.toEntity(request, feature, address, restrictionCategory, buildingCategory);

        return mapper.toResponse(repository.save(building));
    }

    @Override
    public BuildingResponse getById(Integer id) {
        Building building = repository.findById(id)
            .orElseThrow(() -> new RuntimeException("Building not found with id: " + id));
        return mapper.toResponse(building);
    }

    @Override
    public Page<BuildingResponse> list(Pageable pageable) {
        return repository.findAll(pageable)
            .map(mapper::toResponse);
    }

    @Override
    @Transactional
    public BuildingResponse update(
        Integer id,
        BuildingRequest request
    ) {
        Building building = repository.findById(id)
            .orElseThrow(() -> new BusinessException(ErrorCode.BUILDING_NOT_FOUND, "Building not found with id: " + id));

        Feature feature = featureRepository.findById(request.getFeatureId())
            .orElseThrow(() -> new BusinessException(ErrorCode.FEATURE_NOT_FOUND));

        Address address = addressRepository.findById(request.getAddressId())
            .orElseThrow(() -> new BusinessException(ErrorCode.ADDRESS_NOT_FOUND));

        RestrictionCategory restrictionCategory = restrictionCateRepository.findById(request.getRestrictionCategoryId())
            .orElseThrow(() -> new BusinessException(ErrorCode.RESTRICTION_CATEGORY_NOT_FOUND));

        BuildingCategory buildingCategory = buildingCategoryRepository.findById(request.getBuildingCategoryId())
            .orElseThrow(() -> new BusinessException(ErrorCode.BUILDING_CATEGORY_NOT_FOUND));

        mapper.update(
            request,
            feature,
            address,
            restrictionCategory,
            buildingCategory,
            building
        );

        return mapper.toResponse(repository.save(building));
    }

    @Override
    @Transactional
    public void delete(Integer id) {
        Building building = repository.findById(id)
            .orElseThrow(() -> new RuntimeException("Building not found with id: " + id));
        repository.delete(building);
    }

}

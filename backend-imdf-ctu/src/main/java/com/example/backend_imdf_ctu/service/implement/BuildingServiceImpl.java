package com.example.backend_imdf_ctu.service.implement;

import com.example.backend_imdf_ctu.dto.request.BuildingRequest;
import com.example.backend_imdf_ctu.entity.*;
import com.example.backend_imdf_ctu.exception.BusinessException;
import com.example.backend_imdf_ctu.exception.ErrorCode;
import com.example.backend_imdf_ctu.mapper.BuildingMapper;
import com.example.backend_imdf_ctu.repository.*;
import com.example.backend_imdf_ctu.service.interfaces.BuildingService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    public Building create(BuildingRequest request) {
        // 1. Kiểm tra các entity liên quan
        Address address = addressRepository.findById(request.getAddressId())
            .orElseThrow(() -> new BusinessException(ErrorCode.ADDRESS_NOT_FOUND, "Address not found with id: " + request.getAddressId()));

        RestrictionCategory restrictionCategory = restrictionCateRepository.findById(request.getRestrictionCategoryId())
            .orElseThrow(() -> new BusinessException(ErrorCode.RESTRICTION_CATEGORY_NOT_FOUND, "Restriction Category not found with id: " + request.getRestrictionCategoryId()));

        BuildingCategory buildingCategory = buildingCategoryRepository.findById(request.getBuildingCategoryId())
            .orElseThrow(() -> new BusinessException(ErrorCode.BUILDING_CATEGORY_NOT_FOUND, "Building Category not found with id: " + request.getBuildingCategoryId()));

        // 2. Xử lý feature cơ sở: Kiểm tra featureId truyền lên hoặc tự động sinh Feature mới
        Feature feature;
        if (request.getFeatureId() != null) {
            feature = featureRepository.findById(request.getFeatureId())
                .orElseThrow(() -> new BusinessException(ErrorCode.FEATURE_NOT_FOUND, "Không tìm thấy Feature với id = " + request.getFeatureId()));
        } else {
            // Tự động tạo Feature mới nếu không có featureId
            feature = new Feature();
            feature.setFeatureId(java.util.UUID.randomUUID());
            feature.setFeatureType("building");
            feature = featureRepository.save(feature);
        }

        // 3. Tạo và lưu Building mới
        Building building = mapper.toEntity(request, feature, address, restrictionCategory, buildingCategory);
        return repository.save(building);
    }

    @Override
    public Building getById(Integer id) {
        return repository.findById(id)
            .orElseThrow(() -> new BusinessException(ErrorCode.BUILDING_NOT_FOUND, "Building not found with id: " + id));
    }

    @Override
    public Page<Building> list(Pageable pageable) {
            return repository.findAll(pageable);
    }

    @Override
    @Transactional
    public Building update(
        Integer id,
        BuildingRequest request
    ) {
        Building building = repository.findById(id)
            .orElseThrow(() -> new BusinessException(ErrorCode.BUILDING_NOT_FOUND, "Building not found with id: " + id));

        Feature feature = featureRepository.findById(request.getFeatureId())
            .orElseThrow(() -> new BusinessException(ErrorCode.FEATURE_NOT_FOUND, "Feature not found with id: " + request.getFeatureId()));

        Address address = addressRepository.findById(request.getAddressId())
            .orElseThrow(() -> new BusinessException(ErrorCode.ADDRESS_NOT_FOUND, "Address not found with id: " + request.getAddressId()));

        RestrictionCategory restrictionCategory = restrictionCateRepository.findById(request.getRestrictionCategoryId())
            .orElseThrow(() -> new BusinessException(ErrorCode.RESTRICTION_CATEGORY_NOT_FOUND, "Restriction Category not found with id: " + request.getRestrictionCategoryId()));

        BuildingCategory buildingCategory = buildingCategoryRepository.findById(request.getBuildingCategoryId())
            .orElseThrow(() -> new BusinessException(ErrorCode.BUILDING_CATEGORY_NOT_FOUND, "Building Category not found with id: " + request.getBuildingCategoryId()));

        mapper.update(
            request,
            feature,
            address,
            restrictionCategory,
            buildingCategory,
            building
        );

        return repository.save(building);
    }

    @Override
    @Transactional
    public void delete(Integer id) {
        Building building = repository.findById(id)
            .orElseThrow(() -> new BusinessException(ErrorCode.BUILDING_NOT_FOUND, "Building not found with id: " + id));
        repository.delete(building);
    }
}
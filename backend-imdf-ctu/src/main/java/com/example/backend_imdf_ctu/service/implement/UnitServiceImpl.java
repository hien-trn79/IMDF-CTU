package com.example.backend_imdf_ctu.service.implement;

import com.example.backend_imdf_ctu.dto.request.UnitRequest;
import com.example.backend_imdf_ctu.dto.response.UnitResponse;
import com.example.backend_imdf_ctu.entity.*;
import com.example.backend_imdf_ctu.exception.BusinessException;
import com.example.backend_imdf_ctu.exception.ErrorCode;
import com.example.backend_imdf_ctu.mapper.UnitMapper;
import com.example.backend_imdf_ctu.repository.*;
import com.example.backend_imdf_ctu.service.interfaces.UnitService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UnitServiceImpl implements UnitService {

    private final UnitRepository repository;
    private final UnitMapper mapper;

    private final FeatureRepository featureRepository;
    private final LevelRepository levelRepository;
    private final UnitCategoryRepository unitCategoryRepository;
    private final RestrictionCateRepository restrictionCateRepository;

    @Override
    public Page<UnitResponse> getAll(Pageable pageable) {
        return repository.findAll(pageable).map(mapper::toResponse);
    }

    @Override
    public UnitResponse getById(Integer id) {
        return repository.findById(id)
                .map(mapper::toResponse)
                .orElseThrow(() -> new BusinessException(ErrorCode.UNIT_NOT_FOUND));
    }

    @Override
    public UnitResponse create(UnitRequest request) {
        Feature feature = featureRepository.findById(request.getFeatureId())
                .orElseThrow(() -> new BusinessException(ErrorCode.FEATURE_NOT_FOUND, "Không tìm thấy Feature với id = " + request.getFeatureId()));

        Level level = levelRepository.findById(request.getLevelId())
                .orElseThrow(() -> new BusinessException(ErrorCode.LEVEL_NOT_FOUND, "Không tìm thấy Level với id = " + request.getLevelId()));

        RestrictionCategory restrictionCategory = restrictionCateRepository.findById(request.getRestrictionCategoryId())
                .orElseThrow(() -> new BusinessException(ErrorCode.RESTRICTION_CATEGORY_NOT_FOUND, "Không tìm thấy Restriction Category với id = " + request.getRestrictionCategoryId()));

        UnitCategory unitCategory = unitCategoryRepository.findById(request.getUnitCategoryId())
                .orElseThrow(() -> new BusinessException(ErrorCode.UNIT_CATEGORY_NOT_FOUND, "Không tìm thấy Unit Category với id = " + request.getUnitCategoryId()));

        Unit entity = mapper.toEntity(
            request,
            unitCategory,
            feature,
            restrictionCategory,
            level
        );

        return mapper.toResponse(repository.save(entity));
    }

    @Override
    public UnitResponse update(Integer id, UnitRequest request) {
        Feature feature = featureRepository.findById(request.getFeatureId())
            .orElseThrow(() -> new BusinessException(ErrorCode.FEATURE_NOT_FOUND, "Không tìm thấy Feature với id = " + request.getFeatureId()));

        Level level = levelRepository.findById(request.getLevelId())
            .orElseThrow(() -> new BusinessException(ErrorCode.LEVEL_NOT_FOUND, "Không tìm thấy Level với id = " + request.getLevelId()));

        RestrictionCategory restrictionCategory = restrictionCateRepository.findById(request.getRestrictionCategoryId())
            .orElseThrow(() -> new BusinessException(ErrorCode.RESTRICTION_CATEGORY_NOT_FOUND, "Không tìm thấy Restriction Category với id = " + request.getRestrictionCategoryId()));

        UnitCategory unitCategory = unitCategoryRepository.findById(request.getUnitCategoryId())
            .orElseThrow(() -> new BusinessException(ErrorCode.UNIT_CATEGORY_NOT_FOUND, "Không tìm thấy Unit Category với id = " + request.getUnitCategoryId()));

        Unit entity = repository.findById(id)
            .orElseThrow(() -> new BusinessException(ErrorCode.UNIT_NOT_FOUND, "Không tìm thấy Unit với id = " + id));

        mapper.update(
            request,
            unitCategory,
            feature,
            restrictionCategory,
            level,
            entity
        );

        return mapper.toResponse(repository.save(entity));
    }

    @Override
    public void delete(Integer id) {
        Unit entity = repository.findById(id)
            .orElseThrow(() -> new BusinessException(ErrorCode.UNIT_NOT_FOUND, "Không tìm thấy Unit với id = " + id));

        repository.delete(entity);
    }
}

package com.example.backend_imdf_ctu.service.implement;

import com.example.backend_imdf_ctu.dto.request.UnitRequest;
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

import java.util.List;

@Service
@RequiredArgsConstructor
public class UnitServiceImpl implements UnitService {

    private final UnitRepository repository;
    private final UnitMapper mapper;

    private final FeatureRepository featureRepository;
    private final LevelRepository levelRepository;
    private final UnitCategoryRepository unitCategoryRepository;
    private final RestrictionCateRepository restrictionCateRepository;

    private final AnchorRepository anchorRepository;

    @Override
    public List<Unit> getAll() {
        return repository.findAll();
    }

    @Override
    public Unit getById(Integer id) {
        return repository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.UNIT_NOT_FOUND));
    }

    @Override
    public List<Unit> getAllByLevelId(Integer levelId) {
        // TODO: Implement this method
        return repository.findAllByLevelId(levelId)
                .stream()
                .toList();
    }

    @Override
    public Unit create(UnitRequest request) {

        // 1. Validate foreign keys: levelId, restrictionCategoryId, unitCategoryId
        Level level = levelRepository.findById(request.getLevelId())
                .orElseThrow(() -> new BusinessException(ErrorCode.LEVEL_NOT_FOUND, "Không tìm thấy Level với id = " + request.getLevelId()));

        RestrictionCategory restrictionCategory = restrictionCateRepository.findById(request.getRestrictionCategoryId())
                .orElseThrow(() -> new BusinessException(ErrorCode.RESTRICTION_CATEGORY_NOT_FOUND, "Không tìm thấy Restriction Category với id = " + request.getRestrictionCategoryId()));

        UnitCategory unitCategory = unitCategoryRepository.findById(request.getUnitCategoryId())
                .orElseThrow(() -> new BusinessException(ErrorCode.UNIT_CATEGORY_NOT_FOUND, "Không tìm thấy Unit Category với id = " + request.getUnitCategoryId()));

        // 2. Xu ly feature co so: Kiem tra featureId truyen len hoac tu dong sinh Feature moi
        Feature feature;
        if (request.getFeatureId() != null) {
            feature = featureRepository.findById(request.getFeatureId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.FEATURE_NOT_FOUND, "Không tìm thấy Feature với id = " + request.getFeatureId()));
        } else {
            // Tự động tạo Feature mới nếu không có featureId
            feature = new Feature();
            feature.setFeatureId(java.util.UUID.randomUUID());
            feature.setFeatureType("unit");
            feature = featureRepository.save(feature);
        }

        // 3. Tạo Unit mới
        Unit entity = mapper.toEntity(
            request,
            unitCategory,
            feature,
            restrictionCategory,
            level
        );

        return repository.save(entity);
    }

    @Override
    public Unit update(Integer id, UnitRequest request) {
        Level level = levelRepository.findById(request.getLevelId())
            .orElseThrow(() -> new BusinessException(ErrorCode.LEVEL_NOT_FOUND, "Không tìm thấy Level với id = " + request.getLevelId()));

        RestrictionCategory restrictionCategory = restrictionCateRepository.findById(request.getRestrictionCategoryId())
            .orElseThrow(() -> new BusinessException(ErrorCode.RESTRICTION_CATEGORY_NOT_FOUND, "Không tìm thấy Restriction Category với id = " + request.getRestrictionCategoryId()));

        UnitCategory unitCategory = unitCategoryRepository.findById(request.getUnitCategoryId())
            .orElseThrow(() -> new BusinessException(ErrorCode.UNIT_CATEGORY_NOT_FOUND, "Không tìm thấy Unit Category với id = " + request.getUnitCategoryId()));

        Unit entity = repository.findById(id)
            .orElseThrow(() -> new BusinessException(ErrorCode.UNIT_NOT_FOUND, "Không tìm thấy Unit với id = " + id));

        Feature feature = entity.getFeature();
        if (request.getFeatureId() != null) {
            feature = featureRepository.findById(request.getFeatureId())
                .orElseThrow(() -> new BusinessException(ErrorCode.FEATURE_NOT_FOUND, "Không tìm thấy Feature với id = " + request.getFeatureId()));
        }

        mapper.update(
            request,
            unitCategory,
            feature,
            restrictionCategory,
            level,
            entity
        );

        return repository.save(entity);
    }

    @Override
    public void delete(Integer id) {
        Unit entity = repository.findById(id)
            .orElseThrow(() -> new BusinessException(ErrorCode.UNIT_NOT_FOUND, "Không tìm thấy Unit với id = " + id));

        // Thực hiện xóa các Anchor liên quan đến Unit này trước khi xóa Unit
        Anchor anchor = anchorRepository.findByUnitId(id);
        if (anchor != null) {
            anchorRepository.delete(anchor);
        }

        repository.delete(entity);
    }
}

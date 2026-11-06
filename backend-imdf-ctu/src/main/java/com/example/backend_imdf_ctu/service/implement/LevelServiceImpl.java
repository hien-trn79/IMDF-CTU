package com.example.backend_imdf_ctu.service.implement;

import com.example.backend_imdf_ctu.dto.request.LevelRequest;
import com.example.backend_imdf_ctu.entity.Building;
import com.example.backend_imdf_ctu.entity.Level;
import com.example.backend_imdf_ctu.entity.LevelCategory;
import com.example.backend_imdf_ctu.entity.RestrictionCategory;
import com.example.backend_imdf_ctu.exception.BusinessException;
import com.example.backend_imdf_ctu.exception.ErrorCode;
import com.example.backend_imdf_ctu.mapper.LevelMapper;
import com.example.backend_imdf_ctu.repository.BuildingRepository;
import com.example.backend_imdf_ctu.repository.LevelCategoryRepository;
import com.example.backend_imdf_ctu.repository.LevelRepository;
import com.example.backend_imdf_ctu.repository.RestrictionCateRepository;
import com.example.backend_imdf_ctu.service.interfaces.LevelService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LevelServiceImpl implements LevelService {

    private final LevelRepository repository;
    private final LevelMapper mapper;

    private final LevelCategoryRepository levelCategoryRepository;
    private final BuildingRepository buildingRepository;
    private final RestrictionCateRepository restrictionCategoryRepository;

    @Override
    @Transactional
    public Level create(LevelRequest request) {
        // get foreign key
        LevelCategory levelCategory = levelCategoryRepository.findById(request.getLevelCategoryId())
            .orElseThrow(() -> new BusinessException(ErrorCode.LEVEL_CATEGORY_NOT_FOUND));

        RestrictionCategory restrictionCategory = restrictionCategoryRepository.findById(request.getRestrictionCategoryId())
            .orElseThrow(() -> new BusinessException(ErrorCode.RESTRICTION_CATEGORY_NOT_FOUND));

        Building building = buildingRepository.findById(request.getBuildingId())
            .orElseThrow(() -> new BusinessException(ErrorCode.BUILDING_NOT_FOUND));

        Level entity = mapper.toEntity(request, levelCategory, restrictionCategory, building);

        return repository.save(entity);
    }

    @Override
    public Level getById(Integer id) {
        Level entity = repository.findById(id)
            .orElseThrow(() -> new BusinessException(ErrorCode.LEVEL_NOT_FOUND));

        return entity;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Level> getAll(Integer buildingId) {
        return repository.findAllByBuildingId(buildingId);
    }

    @Override
    @Transactional
    public Level update(Integer id, LevelRequest request) {
        Level entity = repository.findById(id)
            .orElseThrow(() -> new BusinessException(ErrorCode.LEVEL_NOT_FOUND));

        LevelCategory levelCategory = levelCategoryRepository.findById(request.getLevelCategoryId())
            .orElseThrow(() -> new BusinessException(ErrorCode.LEVEL_CATEGORY_NOT_FOUND));

        RestrictionCategory restrictionCategory = restrictionCategoryRepository.findById(request.getRestrictionCategoryId())
            .orElseThrow(() -> new BusinessException(ErrorCode.RESTRICTION_CATEGORY_NOT_FOUND));

        Building building = buildingRepository.findById(request.getBuildingId())
            .orElseThrow(() -> new BusinessException(ErrorCode.BUILDING_NOT_FOUND));

        mapper.update(entity, request, levelCategory, restrictionCategory, building);

        return repository.save(entity);
    }

    @Override
    @Transactional
    public void delete(Integer id) {
        Level entity = repository.findById(id)
            .orElseThrow(() -> new BusinessException(ErrorCode.LEVEL_NOT_FOUND));

        repository.delete(entity);
    }
}

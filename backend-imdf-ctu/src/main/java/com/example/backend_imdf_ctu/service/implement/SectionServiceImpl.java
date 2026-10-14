package com.example.backend_imdf_ctu.service.implement;

import com.example.backend_imdf_ctu.dto.request.SectionRequest;
import com.example.backend_imdf_ctu.dto.response.SectionResponse;
import com.example.backend_imdf_ctu.entity.*;
import com.example.backend_imdf_ctu.exception.BusinessException;
import com.example.backend_imdf_ctu.exception.ErrorCode;
import com.example.backend_imdf_ctu.mapper.SectionMapper;
import com.example.backend_imdf_ctu.repository.*;
import com.example.backend_imdf_ctu.service.interfaces.SectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SectionServiceImpl implements SectionService {

    private final SectionRepository repository;
    private final SectionMapper mapper;

    private final SectionCategoryRepository sectionCategoryRepository;
    private final FeatureRepository featureRepository;
    private final RestrictionCateRepository restrictionCateRepository;
    private final LevelRepository levelRepository;

    @Override
    public Page<SectionResponse> getAll(Pageable pageable) {
        return repository.findAll(pageable).map(mapper::toResponse);
    }

    @Override
    public SectionResponse getById(Integer id) {
        return repository.findById(id).map(mapper::toResponse)
                .orElseThrow(() -> new BusinessException(ErrorCode.SECTION_NOT_FOUND, "Section with id " + id + " not found"));
    }

    @Override
    public SectionResponse create(SectionRequest request) {
        SectionCategory sectionCategory = sectionCategoryRepository.findById(request.getSectionCategoryId())
                .orElseThrow(() -> new BusinessException(ErrorCode.SECTION_CATEGORY_NOT_FOUND, "Section category with id " + request.getSectionCategoryId() + " not found"));

        Feature feature = featureRepository.findById(request.getFeatureId())
                .orElseThrow(() -> new BusinessException(ErrorCode.FEATURE_NOT_FOUND, "Feature with id " + request.getFeatureId() + " not found"));

        Level level = levelRepository.findById(request.getLevelId())
                .orElseThrow(() -> new BusinessException(ErrorCode.LEVEL_NOT_FOUND, "Level with id " + request.getLevelId() + " not found"));

        RestrictionCategory restrictionCategory = restrictionCateRepository.findById(request.getRestrictionCateId())
                .orElseThrow(() -> new BusinessException(ErrorCode.RESTRICTION_CATEGORY_NOT_FOUND, "Restriction category with id " + request.getRestrictionCateId() + " not found"));

        Section entity = mapper.toEntity(request, sectionCategory, feature, level, restrictionCategory);

        return mapper.toResponse(repository.save(entity));
    }

    @Override
    public SectionResponse update(Integer id, SectionRequest request) {
        Section existingSection = repository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.SECTION_NOT_FOUND, "Section with id " + id + " not found"));

        SectionCategory sectionCategory = sectionCategoryRepository.findById(request.getSectionCategoryId())
                .orElseThrow(() -> new BusinessException(ErrorCode.SECTION_CATEGORY_NOT_FOUND, "Section category with id " + request.getSectionCategoryId() + " not found"));

        Feature feature = featureRepository.findById(request.getFeatureId())
                .orElseThrow(() -> new BusinessException(ErrorCode.FEATURE_NOT_FOUND, "Feature with id " + request.getFeatureId() + " not found"));

        Level level = levelRepository.findById(request.getLevelId())
                .orElseThrow(() -> new BusinessException(ErrorCode.LEVEL_NOT_FOUND, "Level with id " + request.getLevelId() + " not found"));

        RestrictionCategory restrictionCategory = restrictionCateRepository.findById(request.getRestrictionCateId())
                .orElseThrow(() -> new BusinessException(ErrorCode.RESTRICTION_CATEGORY_NOT_FOUND, "Restriction category with id " + request.getRestrictionCateId() + " not found"));

        Section updatedSection = mapper.toEntity(request, sectionCategory, feature, level, restrictionCategory);
        updatedSection.setId(existingSection.getId());

        return mapper.toResponse(repository.save(updatedSection));
    }

    @Override
    public void delete(Integer id) {
        Section existingSection = repository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.SECTION_NOT_FOUND, "Section with id " + id + " not found"));
        repository.delete(existingSection);
    }
}

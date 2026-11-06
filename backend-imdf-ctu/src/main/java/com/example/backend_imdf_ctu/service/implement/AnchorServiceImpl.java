package com.example.backend_imdf_ctu.service.implement;

import com.example.backend_imdf_ctu.dto.request.AnchorRequest;
import com.example.backend_imdf_ctu.entity.Anchor;
import com.example.backend_imdf_ctu.entity.Feature;
import com.example.backend_imdf_ctu.entity.Unit;
import com.example.backend_imdf_ctu.exception.BusinessException;
import com.example.backend_imdf_ctu.exception.ErrorCode;
import com.example.backend_imdf_ctu.mapper.AnchorMapper;
import com.example.backend_imdf_ctu.repository.AnchorRepository;
import com.example.backend_imdf_ctu.repository.FeatureRepository;
import com.example.backend_imdf_ctu.repository.UnitRepository;
import com.example.backend_imdf_ctu.service.interfaces.AnchorService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AnchorServiceImpl implements AnchorService {

    private final AnchorRepository repository;
    private final AnchorMapper mapper;

    private final FeatureRepository featureRepository;
    private final UnitRepository unitRepository;

    @Override
    public List<Anchor> getAllByUnitLevelId(
        Integer unitLevelId
       ) {
        return repository.findAllByUnitLevelId(unitLevelId);
    }

    @Override
    public Anchor getById(Integer id) {
        return repository.findById(id)
            .orElseThrow(() -> new BusinessException(ErrorCode.ANCHOR_NOT_FOUND));
    }

    @Override
    public Anchor create(AnchorRequest request) {
        Unit unit = unitRepository.findById(request.getUnitId())
            .orElseThrow(() -> new BusinessException(ErrorCode.UNIT_NOT_FOUND));

        Feature feature;
        if(request.getFeatureId() != null) {
            feature = featureRepository.findById(request.getFeatureId())
                .orElseThrow(() -> new BusinessException(ErrorCode.FEATURE_NOT_FOUND));
        } else {
            feature = new Feature();
            feature.setFeatureId(java.util.UUID.randomUUID());
            feature.setFeatureType("anchor");
            feature = featureRepository.save(feature);
        }
        Anchor entity = mapper.toEntity(request, feature, unit);

        return repository.save(entity);
    }

    @Override
    public Anchor update(Integer id, AnchorRequest request) {
        Anchor entity = repository.findById(id)
            .orElseThrow(() -> new BusinessException(ErrorCode.ANCHOR_NOT_FOUND));

        Feature feature = featureRepository.findById(request.getFeatureId())
            .orElseThrow(() -> new BusinessException(ErrorCode.FEATURE_NOT_FOUND));

        Unit unit = unitRepository.findById(request.getUnitId())
            .orElseThrow(() -> new BusinessException(ErrorCode.UNIT_NOT_FOUND));

        mapper.update(entity, request, feature, unit);

        return repository.save(entity);
    }

    @Override
    public void delete(Integer id) {
        Anchor entity = repository.findById(id)
            .orElseThrow(() -> new BusinessException(ErrorCode.ANCHOR_NOT_FOUND));

        repository.delete(entity);
    }
}

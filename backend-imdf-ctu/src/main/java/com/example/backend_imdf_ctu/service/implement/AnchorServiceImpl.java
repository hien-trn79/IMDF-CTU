package com.example.backend_imdf_ctu.service.implement;

import com.example.backend_imdf_ctu.dto.request.AnchorRequest;
import com.example.backend_imdf_ctu.dto.response.AnchorResponse;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AnchorServiceImpl implements AnchorService {

    private final AnchorRepository repository;
    private final AnchorMapper mapper;

    private final FeatureRepository featureRepository;
    private final UnitRepository unitRepository;

    @Override
    public Page<AnchorResponse> getAll(Pageable pageable) {
        return repository.findAll(pageable)
            .map(mapper::toResponse);
    }

    @Override
    public AnchorResponse getById(Integer id) {
        return repository.findById(id)
            .map(mapper::toResponse)
            .orElseThrow(() -> new BusinessException(ErrorCode.ANCHOR_NOT_FOUND));
    }

    @Override
    public AnchorResponse create(AnchorRequest request) {
        Feature feature = featureRepository.findById(request.getFeatureId())
            .orElseThrow(() -> new BusinessException(ErrorCode.FEATURE_NOT_FOUND));

        Unit unit = unitRepository.findById(request.getUnitId())
            .orElseThrow(() -> new BusinessException(ErrorCode.UNIT_NOT_FOUND));

        Anchor entity = mapper.toEntity(request, feature, unit);

        return mapper.toResponse(repository.save(entity));
    }

    @Override
    public AnchorResponse update(Integer id, AnchorRequest request) {
        Anchor entity = repository.findById(id)
            .orElseThrow(() -> new BusinessException(ErrorCode.ANCHOR_NOT_FOUND));

        Feature feature = featureRepository.findById(request.getFeatureId())
            .orElseThrow(() -> new BusinessException(ErrorCode.FEATURE_NOT_FOUND));

        Unit unit = unitRepository.findById(request.getUnitId())
            .orElseThrow(() -> new BusinessException(ErrorCode.UNIT_NOT_FOUND));

        mapper.update(entity, request, feature, unit);

        return mapper.toResponse(repository.save(entity));
    }

    @Override
    public void delete(Integer id) {
        Anchor entity = repository.findById(id)
            .orElseThrow(() -> new BusinessException(ErrorCode.ANCHOR_NOT_FOUND));

        repository.delete(entity);
    }
}

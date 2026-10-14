package com.example.backend_imdf_ctu.service.implement;

import com.example.backend_imdf_ctu.dto.request.RelationShipRequest;
import com.example.backend_imdf_ctu.dto.response.RelationShipResponse;
import com.example.backend_imdf_ctu.entity.Feature;
import com.example.backend_imdf_ctu.entity.RelationShip;
import com.example.backend_imdf_ctu.entity.RelationShipCategory;
import com.example.backend_imdf_ctu.exception.BusinessException;
import com.example.backend_imdf_ctu.exception.ErrorCode;
import com.example.backend_imdf_ctu.mapper.RelationShipMapper;
import com.example.backend_imdf_ctu.repository.FeatureRepository;
import com.example.backend_imdf_ctu.repository.RelationShipCateRepository;
import com.example.backend_imdf_ctu.repository.RelationShipRepository;
import com.example.backend_imdf_ctu.service.interfaces.RelationShipService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RelationShipServiceImpl implements RelationShipService {

    private final RelationShipRepository repository;
    private final RelationShipMapper mapper;

    private final FeatureRepository featureRepository;
    private final RelationShipCateRepository relationShipCateRepository;

    @Override
    public List<RelationShipResponse> getAll() {
        return repository.findAll()
            .stream()
            .map(mapper::toResponse)
            .toList();
    }

    @Override
    public RelationShipResponse getById(Integer id) {
        return repository.findById(id)
            .map(mapper::toResponse)
            .orElseThrow(() -> new BusinessException(ErrorCode.RELATIONSHIP_NOT_FOUND));
    }

    @Override
    public RelationShipResponse create(RelationShipRequest request) {
        Feature feature = featureRepository.findById(request.getFeatureId())
            .orElseThrow(() -> new BusinessException(ErrorCode.FEATURE_NOT_FOUND));

        RelationShipCategory relationShipCategory = relationShipCateRepository.findById(request.getRelationShipCategoryId())
            .orElseThrow(() -> new BusinessException(ErrorCode.RELATIONSHIP_CATEGORY_NOT_FOUND));

        RelationShip entity = mapper.toEntity(request, feature, relationShipCategory);

        return mapper.toResponse(repository.save(entity));
    }

    @Override
    public RelationShipResponse update(Integer id, RelationShipRequest request) {
        RelationShip entity = repository.findById(id)
            .orElseThrow(() -> new BusinessException(ErrorCode.RELATIONSHIP_NOT_FOUND));

        Feature feature = featureRepository.findById(request.getFeatureId())
            .orElseThrow(() -> new BusinessException(ErrorCode.FEATURE_NOT_FOUND));

        RelationShipCategory relationShipCategory = relationShipCateRepository.findById(request.getRelationShipCategoryId())
            .orElseThrow(() -> new BusinessException(ErrorCode.RELATIONSHIP_CATEGORY_NOT_FOUND));

        mapper.update(entity, request, feature, relationShipCategory);

        return mapper.toResponse(repository.save(entity));
    }

    @Override
    public void delete(Integer id) {
        RelationShip entity = repository.findById(id)
            .orElseThrow(() -> new BusinessException(ErrorCode.RELATIONSHIP_NOT_FOUND));

        repository.delete(entity);
    }
}

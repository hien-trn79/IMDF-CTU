package com.example.backend_imdf_ctu.service.implement;

import com.example.backend_imdf_ctu.dto.request.OpeningRequest;
import com.example.backend_imdf_ctu.dto.response.OpeningResponse;
import com.example.backend_imdf_ctu.entity.Opening;
import com.example.backend_imdf_ctu.entity.OpeningCategory;
import com.example.backend_imdf_ctu.entity.Unit;
import com.example.backend_imdf_ctu.exception.BusinessException;
import com.example.backend_imdf_ctu.exception.ErrorCode;
import com.example.backend_imdf_ctu.mapper.OpeningMapper;
import com.example.backend_imdf_ctu.repository.OpeningCategoryRepository;
import com.example.backend_imdf_ctu.repository.OpeningRepository;
import com.example.backend_imdf_ctu.repository.UnitRepository;
import com.example.backend_imdf_ctu.service.interfaces.OpeningService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class OpeningServiceImpl implements OpeningService {

    private final OpeningRepository repository;
    private final OpeningMapper mapper;

    private final UnitRepository unitRepository;
    private final OpeningCategoryRepository openingCategoryRepository;

    @Override
    public Page<OpeningResponse> getAll(Pageable pageable) {
        return repository.findAll(pageable).map(mapper::toResponse);
    }

    @Override
    public OpeningResponse getById(Integer id) {
        return repository.findById(id)
                .map(mapper::toResponse)
                .orElseThrow(() -> new BusinessException(ErrorCode.OPENING_NOT_FOUND));
    }

    @Override
    public OpeningResponse create(OpeningRequest request) {
        Unit unit = unitRepository.findById(request.getUnitId())
                .orElseThrow(() -> new BusinessException(ErrorCode.UNIT_NOT_FOUND));

        OpeningCategory openingCategory = openingCategoryRepository.findById(request.getOpeningCategoryId())
                .orElseThrow(() -> new BusinessException(ErrorCode.OPENING_CATEGORY_NOT_FOUND));

        Opening entity = mapper.toEntity(request, unit, openingCategory);
        return mapper.toResponse(repository.save(entity));
    }

    @Override
    public OpeningResponse update(Integer id, OpeningRequest request) {
        Unit unit = unitRepository.findById(request.getUnitId())
                .orElseThrow(() -> new BusinessException(ErrorCode.UNIT_NOT_FOUND));

        OpeningCategory openingCategory = openingCategoryRepository.findById(request.getOpeningCategoryId())
                .orElseThrow(() -> new BusinessException(ErrorCode.OPENING_CATEGORY_NOT_FOUND));

        Opening entity = repository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.OPENING_NOT_FOUND));

        mapper.update(entity, request, unit, openingCategory);
        return mapper.toResponse(repository.save(entity));
    }

    @Override
    public void delete(Integer id) {
        Opening entity = repository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.OPENING_NOT_FOUND));
        repository.delete(entity);
    }
}

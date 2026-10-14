package com.example.backend_imdf_ctu.service.implement;

import com.example.backend_imdf_ctu.dto.request.LevelRequest;
import com.example.backend_imdf_ctu.dto.response.LevelResponse;
import com.example.backend_imdf_ctu.entity.Level;
import com.example.backend_imdf_ctu.entity.LevelCategory;
import com.example.backend_imdf_ctu.exception.BusinessException;
import com.example.backend_imdf_ctu.exception.ErrorCode;
import com.example.backend_imdf_ctu.mapper.GeometryConverter;
import com.example.backend_imdf_ctu.mapper.LevelMapper;
import com.example.backend_imdf_ctu.repository.LevelCategoryRepository;
import com.example.backend_imdf_ctu.repository.LevelRepository;
import com.example.backend_imdf_ctu.service.interfaces.LevelService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LevelServiceImpl implements LevelService {

    private final LevelRepository repository;
    private final LevelMapper mapper;

    private final LevelCategoryRepository levelCategoryRepository;

    @Override
    @Transactional
    public LevelResponse create(LevelRequest request) {
        LevelCategory levelCategory = levelCategoryRepository.findById(request.getLevelCategoryId())
            .orElseThrow(() -> new BusinessException(ErrorCode.LEVEL_CATEGORY_NOT_FOUND));

        Level entity = mapper.toEntity(request, levelCategory);

        return mapper.toResponse(repository.save(entity));
    }

    @Override
    public LevelResponse getById(Integer id) {
        Level entity = repository.findById(id)
            .orElseThrow(() -> new BusinessException(ErrorCode.LEVEL_NOT_FOUND));

        return mapper.toResponse(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<LevelResponse> list(Pageable pageable) {
        return repository.findAll(pageable)
            .map(mapper::toResponse);
    }

    @Override
    @Transactional
    public LevelResponse update(Integer id, LevelRequest request) {
        Level entity = repository.findById(id)
            .orElseThrow(() -> new BusinessException(ErrorCode.LEVEL_NOT_FOUND));

        LevelCategory levelCategory = levelCategoryRepository.findById(request.getLevelCategoryId())
            .orElseThrow(() -> new BusinessException(ErrorCode.LEVEL_CATEGORY_NOT_FOUND));

        mapper.update(entity, request, levelCategory);

        return mapper.toResponse(repository.save(entity));
    }

    @Override
    @Transactional
    public void delete(Integer id) {
        Level entity = repository.findById(id)
            .orElseThrow(() -> new BusinessException(ErrorCode.LEVEL_NOT_FOUND));

        repository.delete(entity);
    }
}

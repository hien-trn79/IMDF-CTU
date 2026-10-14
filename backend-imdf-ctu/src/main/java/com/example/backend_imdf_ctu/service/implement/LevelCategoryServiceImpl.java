package com.example.backend_imdf_ctu.service.implement;

import com.example.backend_imdf_ctu.dto.request.LevelCategoryRequest;
import com.example.backend_imdf_ctu.dto.response.LevelCategoryResponse;
import com.example.backend_imdf_ctu.entity.LevelCategory;
import com.example.backend_imdf_ctu.mapper.LevelCategoryMapper;
import com.example.backend_imdf_ctu.repository.LevelCategoryRepository;
import com.example.backend_imdf_ctu.service.interfaces.LevelCategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LevelCategoryServiceImpl implements LevelCategoryService {

    private final LevelCategoryRepository repository;
    private final LevelCategoryMapper mapper;

    @Override
    public List<LevelCategoryResponse> getAll() {
        return repository.findAll()
            .stream()
            .map(mapper::toResponse)
            .toList();
    }

    @Override
    public LevelCategoryResponse create(LevelCategoryRequest request) {
        LevelCategory entity = mapper.toEntity(request);

        return mapper.toResponse(repository.save(entity));
    }
}

package com.example.backend_imdf_ctu.service.implement;

import com.example.backend_imdf_ctu.dto.request.BuildingCategoryRequest;
import com.example.backend_imdf_ctu.dto.response.BuildingCategoryResponse;
import com.example.backend_imdf_ctu.entity.BuildingCategory;
import com.example.backend_imdf_ctu.mapper.BuildingCategoryMapper;
import com.example.backend_imdf_ctu.repository.BuildingCategoryRepository;
import com.example.backend_imdf_ctu.service.interfaces.BuildingCategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BuildingCategoryServiceImpl implements BuildingCategoryService {
    private final BuildingCategoryRepository repository;
    private final BuildingCategoryMapper mapper;

    @Override
    public List<BuildingCategoryResponse> getAll() {
        return repository.findAll()
            .stream()
            .map(mapper::toResponse)
            .toList();
    }

    @Override
    public BuildingCategoryResponse create(BuildingCategoryRequest request) {
        BuildingCategory entity = mapper.toEntity(request);

        return mapper.toResponse(repository.save(entity));
    }
}

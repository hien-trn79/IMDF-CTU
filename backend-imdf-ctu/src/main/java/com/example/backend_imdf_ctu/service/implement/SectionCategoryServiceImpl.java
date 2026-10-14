package com.example.backend_imdf_ctu.service.implement;

import com.example.backend_imdf_ctu.dto.request.SectionCategoryRequest;
import com.example.backend_imdf_ctu.dto.response.SectionCategoryResponse;
import com.example.backend_imdf_ctu.entity.SectionCategory;
import com.example.backend_imdf_ctu.mapper.SectionCategoryMapper;
import com.example.backend_imdf_ctu.repository.SectionCategoryRepository;
import com.example.backend_imdf_ctu.service.interfaces.SectionCategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SectionCategoryServiceImpl implements SectionCategoryService {

    private final SectionCategoryRepository repository;
    private final SectionCategoryMapper mapper;

    @Override
    public List<SectionCategoryResponse> getAll() {
        return repository.findAll()
            .stream()
            .map(mapper::toResponse)
            .toList();
    }

    @Override
    public SectionCategoryResponse create(SectionCategoryRequest request) {
        SectionCategory entity = mapper.toEntity(request);

        return mapper.toResponse(repository.save(entity));
    }
}

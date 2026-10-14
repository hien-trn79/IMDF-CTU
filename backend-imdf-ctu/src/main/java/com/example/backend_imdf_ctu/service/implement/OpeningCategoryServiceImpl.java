package com.example.backend_imdf_ctu.service.implement;

import com.example.backend_imdf_ctu.dto.request.OpeningCategoryRequest;
import com.example.backend_imdf_ctu.dto.response.OpeningCategoryResponse;
import com.example.backend_imdf_ctu.mapper.OpeningCategoryMapper;
import com.example.backend_imdf_ctu.repository.OpeningCategoryRepository;
import com.example.backend_imdf_ctu.service.interfaces.OpeningCategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class OpeningCategoryServiceImpl implements OpeningCategoryService {

    private final OpeningCategoryRepository repository;
    private final OpeningCategoryMapper mapper;

    @Override
    public List<OpeningCategoryResponse> getAll() {
        return repository.findAll()
                .stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    public OpeningCategoryResponse create(OpeningCategoryRequest request) {
        return mapper.toResponse(repository.save(mapper.toEntity(request)));
    }
}

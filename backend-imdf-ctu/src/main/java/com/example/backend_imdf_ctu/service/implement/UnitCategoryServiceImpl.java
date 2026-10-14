package com.example.backend_imdf_ctu.service.implement;

import com.example.backend_imdf_ctu.dto.request.UnitCategoryRequest;
import com.example.backend_imdf_ctu.dto.response.UnitCategoryResponse;
import com.example.backend_imdf_ctu.entity.UnitCategory;
import com.example.backend_imdf_ctu.exception.BusinessException;
import com.example.backend_imdf_ctu.exception.ErrorCode;
import com.example.backend_imdf_ctu.mapper.UnitCategoryMapper;
import com.example.backend_imdf_ctu.repository.UnitCategoryRepository;
import com.example.backend_imdf_ctu.service.interfaces.UnitCategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UnitCategoryServiceImpl implements UnitCategoryService {

    private final UnitCategoryRepository repository;
    private final UnitCategoryMapper mapper;

    @Override
    public List<UnitCategoryResponse> getAll() {
        return repository.findAll()
            .stream()
            .map(mapper::toResponse)
            .toList();
    }

    @Override
    public UnitCategoryResponse create(UnitCategoryRequest request) {
        UnitCategory entity = mapper.toEntity(request);

        return mapper.toResponse(repository.save(entity));
    }

    @Override
    public UnitCategoryResponse getById(Integer id) {
        return mapper.toResponse(
            repository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.UNIT_CATEGORY_NOT_FOUND))
        );
    }
}

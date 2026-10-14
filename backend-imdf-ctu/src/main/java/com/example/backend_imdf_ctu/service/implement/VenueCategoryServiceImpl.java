package com.example.backend_imdf_ctu.service.implement;

import com.example.backend_imdf_ctu.dto.request.VenueCategoryRequest;
import com.example.backend_imdf_ctu.dto.response.VenueCategoryResponse;
import com.example.backend_imdf_ctu.entity.VenueCategory;
import com.example.backend_imdf_ctu.mapper.VenueCategoryMapper;
import com.example.backend_imdf_ctu.repository.VenueCategoryRepository;
import com.example.backend_imdf_ctu.service.interfaces.VenueCategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class VenueCategoryServiceImpl implements VenueCategoryService {

    private final VenueCategoryRepository repository;
    private final VenueCategoryMapper mapper;

    @Override
    public List<VenueCategoryResponse> getAll() {
        return repository.findAll()
            .stream()
            .map(mapper::toResponse)
            .toList();
    }

    @Override
    public VenueCategoryResponse create(VenueCategoryRequest request) {
        VenueCategory entity = mapper.toEntity(request);
        return mapper.toResponse(repository.save(entity));
    }
}

package com.example.backend_imdf_ctu.service.implement;

import com.example.backend_imdf_ctu.dto.request.AmenityCateRequest;
import com.example.backend_imdf_ctu.dto.response.AmenityCateResponse;
import com.example.backend_imdf_ctu.entity.AmenityCategory;
import com.example.backend_imdf_ctu.mapper.AmenityCategoryMapper;
import com.example.backend_imdf_ctu.repository.AmenityCategoryRepository;
import com.example.backend_imdf_ctu.service.interfaces.AmenityCategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AmenityCategoryServiceImpl implements AmenityCategoryService {

    private final AmenityCategoryRepository repository;
    private final AmenityCategoryMapper mapper;

    @Override
    public AmenityCateResponse create(AmenityCateRequest request) {
        AmenityCategory entity = mapper.toEntity(request);
        return mapper.toResponse(repository.save(entity));
    }

    @Override
    public List<AmenityCateResponse> getAll() {
         return repository.findAll()
             .stream()
             .map(mapper::toResponse)
             .toList();
    }
}

package com.example.backend_imdf_ctu.service.implement;

import com.example.backend_imdf_ctu.dto.request.RestrictionCateRequest;
import com.example.backend_imdf_ctu.dto.response.RestrictionCateResponse;
import com.example.backend_imdf_ctu.entity.RestrictionCategory;
import com.example.backend_imdf_ctu.mapper.RestrictionCateMapper;
import com.example.backend_imdf_ctu.repository.RestrictionCateRepository;
import com.example.backend_imdf_ctu.service.interfaces.RestrictionCateService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RestrictionCateServiceImpl implements RestrictionCateService {

    private final RestrictionCateRepository repository;
    private final RestrictionCateMapper mapper;

    @Override
    public RestrictionCateResponse create(RestrictionCateRequest request) {
        RestrictionCategory entity = mapper.toEntity(request);

        return mapper.toResponse(repository.save(entity));
    }

    @Override
    public RestrictionCateResponse getById(Integer id) {
        return repository.findById(id)
                .map(mapper::toResponse)
                .orElseThrow(() -> new RuntimeException("Restriction category not found with id: " + id));
    }
}

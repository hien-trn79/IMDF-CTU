package com.example.backend_imdf_ctu.service.implement;

import com.example.backend_imdf_ctu.dto.request.RelationShipCateRequest;
import com.example.backend_imdf_ctu.dto.response.RelationShipCateResponse;
import com.example.backend_imdf_ctu.entity.RelationShipCategory;
import com.example.backend_imdf_ctu.mapper.RelationShipCateMapper;
import com.example.backend_imdf_ctu.repository.RelationShipCateRepository;
import com.example.backend_imdf_ctu.service.interfaces.RelationShipCateService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RelationShipCateServiceImpl implements RelationShipCateService {
    private final RelationShipCateRepository repository;
    private final RelationShipCateMapper mapper;

    @Override
    public List<RelationShipCateResponse> getAll() {
        return repository.findAll().stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    public RelationShipCateResponse create(RelationShipCateRequest request) {
        RelationShipCategory entity = mapper.toEntity(request);

        return mapper.toResponse(repository.save(entity));
    }
}

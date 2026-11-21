package com.example.backend_imdf_ctu.service.implement;

import com.example.backend_imdf_ctu.dto.request.GeoJsonGeometry;
import com.example.backend_imdf_ctu.dto.request.VenueRequest;
import com.example.backend_imdf_ctu.dto.response.VenueResponse;
import com.example.backend_imdf_ctu.entity.*;
import com.example.backend_imdf_ctu.enums.EntityType;
import com.example.backend_imdf_ctu.enums.HistoryAction;
import com.example.backend_imdf_ctu.exception.BusinessException;
import com.example.backend_imdf_ctu.exception.ErrorCode;
import com.example.backend_imdf_ctu.exception.InvalidGeometryException;
import com.example.backend_imdf_ctu.mapper.GeometryConverter;
import com.example.backend_imdf_ctu.mapper.HistoryRecorder;
import com.example.backend_imdf_ctu.mapper.MultiPolygonNormalizer;
import com.example.backend_imdf_ctu.mapper.VenueMapper;
import com.example.backend_imdf_ctu.repository.*;
import com.example.backend_imdf_ctu.service.interfaces.VenueService;
import lombok.RequiredArgsConstructor;
import org.locationtech.jts.geom.Geometry;
import org.locationtech.jts.geom.MultiPolygon;
import org.locationtech.jts.geom.Point;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class VenueServiceImpl implements VenueService {

    private final VenueRepository venueRepository;
    private final VenueCategoryRepository categoryRepository;
    private final AddressRepository addressRepository;
    private final VenueMapper venueMapper;

    private final FeatureRepository featureRepository;
    private final RestrictionCateRepository restrictionCateRepository;


    public VenueServiceImpl(VenueRepository venueRepository,
                            VenueCategoryRepository categoryRepository,
                            AddressRepository addressRepository,
                            VenueMapper venueMapper,
                            FeatureRepository featureRepository,
                            RestrictionCateRepository restrictionCateRepository
    ) {
        this.venueRepository = venueRepository;
        this.categoryRepository = categoryRepository;
        this.addressRepository = addressRepository;
        this.venueMapper = venueMapper;
        this.featureRepository = featureRepository;
        this.restrictionCateRepository = restrictionCateRepository;
    }

    @Override
    @Transactional
    public Venue create(VenueRequest request) {
        RestrictionCategory restrictionCategory = restrictionCateRepository.findById(request.getRestrictionCategoryId())
            .orElseThrow(() -> new BusinessException(ErrorCode.RESTRICTION_CATEGORY_NOT_FOUND, "Không tìm thấy RestrictionCategory với id = " + request.getRestrictionCategoryId()));

        VenueCategory venueCategory = categoryRepository.findById(request.getVenueCategoryId())
            .orElseThrow(() -> new BusinessException(ErrorCode.VENUE_CATEGORY_NOT_FOUND, "Không tìm thấy VenueCategory với id = " + request.getVenueCategoryId()));

        Address address = addressRepository.findById(request.getAddressId())
            .orElseThrow(() -> new BusinessException(ErrorCode.ADDRESS_NOT_FOUND, "Không tìm thấy Address với id = " + request.getAddressId()));

        Feature feature;
        if (request.getFeatureId() != null) {
            feature = featureRepository.findById(request.getFeatureId())
                .orElseThrow(() -> new BusinessException(ErrorCode.FEATURE_NOT_FOUND, "Không tìm thấy Feature với id = " + request.getFeatureId()));
        } else {
            // Tự động tạo Feature mới nếu không có featureId
            feature = new Feature();
            feature.setFeatureId(java.util.UUID.randomUUID());
            feature.setFeatureType("venue");
            feature = featureRepository.save(feature);
        }

        Venue venue = venueMapper.toEntity(
            request,
            feature,
            venueCategory,
            address,
            restrictionCategory
        );

        return venueRepository.save(venue);
    }

    @Override
    public Venue getById(Integer id) {
        return venueRepository.findById(id)
            .orElseThrow(() -> new BusinessException(ErrorCode.VENUE_NOT_FOUND, "Không tìm thấy Venue với id = " + id));
    }

    @Override
    public List<Venue> getAll() {
        return venueRepository.findAll()
            .stream()
            .toList();
    }

    @Override
    @Transactional
    public Venue update(Integer id, VenueRequest request) {
        Venue venue = venueRepository.findById(id)
            .orElseThrow(() -> new BusinessException(ErrorCode.VENUE_NOT_FOUND, "Không tìm thấy Venue với id = " + id));

        RestrictionCategory restrictionCategory = restrictionCateRepository.findById(request.getRestrictionCategoryId())
            .orElseThrow(() -> new BusinessException(ErrorCode.RESTRICTION_CATEGORY_NOT_FOUND, "Không tìm thấy RestrictionCategory với id = " + request.getRestrictionCategoryId()));

        Feature feature;
        if (request.getFeatureId() != null) {
            feature = featureRepository.findById(request.getFeatureId())
                .orElseThrow(() -> new BusinessException(ErrorCode.FEATURE_NOT_FOUND, "Không tìm thấy Feature với id = " + request.getFeatureId()));
        } else {
            // Tự động tạo Feature mới nếu không có featureId
            feature = new Feature();
            feature.setFeatureId(java.util.UUID.randomUUID());
            feature.setFeatureType("venue");
            feature = featureRepository.save(feature);
        }

        VenueCategory venueCategory = categoryRepository.findById(request.getVenueCategoryId())
            .orElseThrow(() -> new BusinessException(ErrorCode.VENUE_CATEGORY_NOT_FOUND, "Không tìm thấy VenueCategory với id = " + request.getVenueCategoryId()));

        Address address = addressRepository.findById(request.getAddressId())
            .orElseThrow(() -> new BusinessException(ErrorCode.ADDRESS_NOT_FOUND, "Không tìm thấy Address với id = " + request.getAddressId()));


        venueMapper.updateScalars(
            request,
            venue,
            feature,
            venueCategory,
            address,
            restrictionCategory
        );

        return venueRepository.save(venue);
    }

    @Override
    @Transactional
    public void delete(Integer id) {
        Venue venue = venueRepository.findById(id)
            .orElseThrow(() -> new BusinessException(ErrorCode.VENUE_NOT_FOUND, "Không tìm thấy Venue với id = " + id));

        // Xóa Venue
        venueRepository.delete(venue);
    }


}

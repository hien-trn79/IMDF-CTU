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
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class VenueServiceImpl implements VenueService {
    private static final int SRID = 4326;

    private final VenueRepository venueRepository;
    private final VenueCategoryRepository categoryRepository;
    private final AddressRepository addressRepository;
    private final VenueMapper venueMapper;
    private final GeometryConverter geometryConverter;
    private final MultiPolygonNormalizer normalizer;
    private final HistoryRecorder historyRecorder;

    private final FeatureRepository featureRepository;
    private final RestrictionCateRepository restrictionCateRepository;


    public VenueServiceImpl(VenueRepository venueRepository,
                            VenueCategoryRepository categoryRepository,
                            AddressRepository addressRepository,
                            VenueMapper venueMapper,
                            GeometryConverter geometryConverter,
                            MultiPolygonNormalizer normalizer,
                            HistoryRecorder historyRecorder,
                            FeatureRepository featureRepository,
                            RestrictionCateRepository restrictionCateRepository
    ) {
        this.venueRepository = venueRepository;
        this.categoryRepository = categoryRepository;
        this.addressRepository = addressRepository;
        this.venueMapper = venueMapper;
        this.geometryConverter = geometryConverter;
        this.normalizer = normalizer;
        this.historyRecorder = historyRecorder;
        this.featureRepository = featureRepository;
        this.restrictionCateRepository = restrictionCateRepository;
    }

    @Override
    @Transactional
    public VenueResponse create(VenueRequest request) {
        Feature feature = featureRepository.findById(request.getFeatureId())
            .orElseThrow(() -> new BusinessException(ErrorCode.FEATURE_NOT_FOUND, "Không tìm thấy Feature với id = " + request.getFeatureId()));

        RestrictionCategory restrictionCategory = restrictionCateRepository.findById(request.getRestrictionCategoryId())
            .orElseThrow(() -> new BusinessException(ErrorCode.RESTRICTION_CATEGORY_NOT_FOUND, "Không tìm thấy RestrictionCategory với id = " + request.getRestrictionCategoryId()));

        VenueCategory venueCategory = categoryRepository.findById(request.getVenueCategoryId())
            .orElseThrow(() -> new BusinessException(ErrorCode.VENUE_CATEGORY_NOT_FOUND, "Không tìm thấy VenueCategory với id = " + request.getVenueCategoryId()));

        Address address = addressRepository.findById(request.getAddressId())
            .orElseThrow(() -> new BusinessException(ErrorCode.ADDRESS_NOT_FOUND, "Không tìm thấy Address với id = " + request.getAddressId()));

        Venue venue = venueMapper.toEntity(
            request,
            feature,
            venueCategory,
            address,
            restrictionCategory
        );   // chỉ map thuộc tính thường
        applyRelations(
            venue,
            request.getVenueCategoryId(),
            request.getAddressId()
        );
        applyGeometry(venue, request.getGeometry(), request.getDisplayPoint());

        Venue saved = venueRepository.saveAndFlush(venue);
        historyRecorder.record(EntityType.VENUE, saved.getId(), HistoryAction.CREATE,
            null, snapshot(saved, false));
        return venueMapper.toResponse(saved);
    }

    @Override
    public VenueResponse getById(Integer id) {
        return venueMapper.toResponse(findOrThrow(id));
    }

    @Override
    public Page<VenueResponse> list(Pageable pageable) {
        return venueRepository.findAll(pageable).map(venueMapper::toResponse);
    }

    @Override
    @Transactional
    public VenueResponse update(Integer id, VenueRequest request) {
        Venue venue = venueRepository.findById(id)
            .orElseThrow(() -> new BusinessException(ErrorCode.VENUE_NOT_FOUND, "Không tìm thấy Venue với id = " + id));
        Map<String, Object> before = snapshot(venue, false);
        MultiPolygon oldGeom = venue.getGeometry();

        venueMapper.updateScalars(request, venue);
        applyRelations(venue, request.getVenueCategoryId(), request.getAddressId());
        applyGeometry(venue, request.getGeometry(), request.getDisplayPoint());

        boolean geomChanged = oldGeom == null || !oldGeom.equalsExact(venue.getGeometry(), 1e-9);
        venueRepository.flush();
        historyRecorder.record(EntityType.VENUE, id, HistoryAction.UPDATE,
            before, snapshot(venue, geomChanged));
        return venueMapper.toResponse(venue);
    }

    @Override
    @Transactional
    public void delete(Integer id) {
        Venue venue = findOrThrow(id);
        Map<String, Object> before = snapshot(venue, false);
        venueRepository.delete(venue);
        venueRepository.flush();   // lỗi khóa ngoại lộ ra tại đây, trước khi ghi lịch sử
        historyRecorder.record(EntityType.VENUE, id, HistoryAction.DELETE, before, null);
    }

    // ---------- private ----------

    private Venue findOrThrow(Integer id) {
        return venueRepository.findById(id)
            .orElseThrow(() -> new BusinessException(ErrorCode.VENUE_NOT_FOUND, "Không tìm thấy Venue với id = " + id));
    }

    private void applyRelations(Venue venue, Integer categoryId, Integer addressId) {
        venue.setVenueCategory(categoryRepository.findById(categoryId)
            .orElseThrow(() -> new BusinessException(ErrorCode.VENUE_CATEGORY_NOT_FOUND, "Không tìm thấy VenueCategory với id = " + categoryId)));
        venue.setAddress(addressRepository.findById(addressId)
            .orElseThrow(() -> new BusinessException(ErrorCode.ADDRESS_NOT_FOUND, "Không tìm thấy Address với id = " + addressId)));
    }

    private void applyGeometry(Venue venue, GeoJsonGeometry geometry, GeoJsonGeometry displayPoint) {
        MultiPolygon geom = normalizer.normalize(geometryConverter.toJts(geometry));
        venue.setGeometry(geom);

        Point point;
        if (displayPoint != null) {
            Geometry converted = geometryConverter.toJts(displayPoint);
            if (!(converted instanceof Point p)) {
                throw new InvalidGeometryException("display_point phải là Point");
            }
            if (!geom.covers(p)) {
                throw new InvalidGeometryException("display_point phải nằm trong hình học của Venue");
            }
            point = p;
        } else {
            point = geom.getInteriorPoint();   // điểm chắc chắn nằm trong đa giác
        }
        point.setSRID(SRID);
        venue.setDisplayPoint(point);
    }

    /** Chỉ lưu thuộc tính. Hình học chỉ ghi cờ đã đổi, không lưu tọa độ. */
    private Map<String, Object> snapshot(Venue v, boolean geomChanged) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("categoryId", v.getVenueCategory().getId());
        m.put("addressId", v.getAddress().getId());
        m.put("hours", v.getHours());
        m.put("phone", v.getPhone());
        m.put("website", v.getWebsite());
        if (geomChanged) m.put("geomChanged", true);
        return m;
    }
}

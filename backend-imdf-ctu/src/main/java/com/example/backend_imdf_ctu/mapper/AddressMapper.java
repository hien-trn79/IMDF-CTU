package com.example.backend_imdf_ctu.mapper;

import com.example.backend_imdf_ctu.dto.request.AddressRequest;
import com.example.backend_imdf_ctu.dto.response.AddressResponse;
import com.example.backend_imdf_ctu.entity.Address;
import com.example.backend_imdf_ctu.entity.Feature;
import org.springframework.stereotype.Component;

@Component
public class AddressMapper {
    public AddressResponse toResponse(Address entity) {
        return new AddressResponse(
            entity.getId(),
            entity.getAddressId().toString(),
            entity.getAddress(),
            entity.getUnit(),
            entity.getLocality(),
            entity.getProvince(),
            entity.getCountry(),
            entity.getPostalCode(),
            entity.getPostalCodeExtension(),
            entity.getPostalCodeVanity(),
            entity.getFeature().getId()
        );
    }

    public Address toEntity(AddressRequest request, Feature feature) {
        Address entity = new Address();

        entity.setAddress(request.getAddress());
        entity.setUnit(request.getUnit());
        entity.setLocality(request.getLocality());
        entity.setProvince(request.getProvince());
        entity.setCountry(request.getCountry());
        entity.setPostalCode(request.getPostalCode());
        entity.setPostalCodeExtension(request.getPostalCodeExtension());
        entity.setPostalCodeVanity(request.getPostalCodeVanity());

        entity.setFeature(feature);
        return entity;
    }

    public void update(
        Address entity,
        AddressRequest request,
        Feature feature)
    {
        entity.setAddress(request.getAddress());
        entity.setUnit(request.getUnit());
        entity.setLocality(request.getLocality());
        entity.setProvince(request.getProvince());
        entity.setCountry(request.getCountry());
        entity.setPostalCode(request.getPostalCode());
        entity.setPostalCodeExtension(request.getPostalCodeExtension());
        entity.setPostalCodeVanity(request.getPostalCodeVanity());

        entity.setFeature(feature);
    }
}

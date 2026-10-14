package com.example.backend_imdf_ctu.dto.request;

import lombok.Data;

@Data
public class AddressRequest {
    private String address;

    private String unit;

    private String locality;

    private String province;

    private String country;

    private String postalCode;

    private String postalCodeExtension;

    private String postalCodeVanity;

    private Integer featureId;
}

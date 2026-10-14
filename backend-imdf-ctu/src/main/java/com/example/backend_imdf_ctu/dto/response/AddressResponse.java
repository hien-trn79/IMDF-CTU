package com.example.backend_imdf_ctu.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AddressResponse {
    private Integer id;

    private String addressId;

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

package com.example.backend_imdf_ctu.service.interfaces;

public interface GeoServerPublisherService {

    boolean publishPostgisLayer(String tableName, String layerDisplayName);

    boolean deleteLayer(String layerName);
}

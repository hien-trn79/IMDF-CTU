package com.example.backend_imdf_ctu.entity;

import org.locationtech.jts.geom.Geometry;

import java.util.Map;

public interface GeoJson {
    Object getId();
    Geometry getGeometry();
    Map<String, Object> getProperties();
}

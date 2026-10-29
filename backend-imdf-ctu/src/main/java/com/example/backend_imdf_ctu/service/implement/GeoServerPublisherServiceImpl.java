package com.example.backend_imdf_ctu.service.implement;

import com.example.backend_imdf_ctu.config.GeoServerConfig;
import com.example.backend_imdf_ctu.service.interfaces.GeoServerPublisherService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Slf4j
@Service
@RequiredArgsConstructor
public class GeoServerPublisherServiceImpl implements GeoServerPublisherService {

    private final WebClient geoServerWebClient;
    private final GeoServerConfig config;

    /**
     * Tự động Publish một bảng PostGIS (VD: unit, level) thành Layer trên GeoServer
     */
    @Override
    public boolean publishPostgisLayer(String tableName, String layerDisplayName) {
        String workspace = config.getDefaultWorkspace();
        String datastore = config.getDefaultDatastore();

        // XML Payload gửi sang GeoServer REST API để tạo FeatureType (Layer)
        String featureTypeXml = String.format(
            "<featureType>" +
                "<name>%s</name>" +
                "<nativeName>%s</nativeName>" +
                "<title>%s</title>" +
                "<srs>EPSG:4326</srs>" +
                "<nativeBoundingBox><minx>-180</minx><maxx>180</maxx><miny>-90</miny><maxy>90</maxy><crs>EPSG:4326</crs></nativeBoundingBox>" +
                "</featureType>",
            tableName, tableName, layerDisplayName
        );

        try {
            geoServerWebClient.post()
                .uri("/workspaces/{ws}/datastores/{ds}/featuretypes", workspace, datastore)
                .contentType(MediaType.APPLICATION_XML)
                .bodyValue(featureTypeXml)
                .retrieve()
                .bodyToMono(String.class)
                .block();

            log.info("Publish thành công layer {} lên GeoServer", tableName);
            return true;
        } catch (Exception e) {
            log.error("Lỗi khi publish layer lên GeoServer: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Xóa Layer khỏi GeoServer
     */
    @Override
    public boolean deleteLayer(String layerName) {
        String workspace = config.getDefaultWorkspace();
        try {
            geoServerWebClient.delete()
                .uri("/workspaces/{ws}/layers/{layer}?recurse=true", workspace, layerName)
                .retrieve()
                .bodyToMono(Void.class)
                .block();

            log.info("Đã xóa layer {} trên GeoServer", layerName);
            return true;
        } catch (Exception e) {
            log.error("Lỗi khi xóa layer trên GeoServer: {}", e.getMessage());
            return false;
        }
    }
}

package com.example.backend_imdf_ctu.repository;

import com.example.backend_imdf_ctu.entity.Anchor;
import com.example.backend_imdf_ctu.entity.GeoJson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IndoorRoutingRepository extends JpaRepository<Anchor, Integer> {

    @Query(value = """
            select
              n.id
            from
              network_nodes_ctu n
              join anchor a on st_dwithin (n.geometry, a.geometry, 0.0001)
            where
              a.id = :anchorId
              and n.indoor_route_id = (
                select
                  i.id
                from
                  indoor_route i
                where
                  i.level_id = :levelId
              )
            order by
              n.geometry <-> a.geometry
            limit 1
        """, nativeQuery = true)
    Integer findNodeIdByAnchorAndLevel(
        @Param("anchorId") Integer anchorId,
        @Param("levelId") Integer levelId
    );

    @Query(value = """
            select n.id
            from network_nodes_ctu n
            where n.indoor_route_id = (
              select i.id from indoor_route i where i.level_id = :levelId
            )
            order by n.geometry <-> st_setsrid(st_point(:lng, :lat), 4326)
            limit 1
        """, nativeQuery = true)
    Integer findNearestNodeByCoordinate(
        @Param("lng") double lng,
        @Param("lat") double lat,
        @Param("levelId") Integer levelId
    );

    @Query(value = "select ordinal from level where id = :levelId", nativeQuery = true)
    Integer findLevelOrdinal(@Param("levelId") Integer levelId);

    @Query(value = """
            select
              e.id as id,
              e.geometry as geometry,
              jsonb_build_object(
                'seq', path.seq,
                'cost', e.cost,
                'route_id', e.indoor_route_id
              )::text as properties
            from
              pgr_dijkstra (
                'SELECT id::bigint AS id, source::bigint AS source, target::bigint AS target, cost::float8 AS cost, reverse_cost::float8 AS reverse_cost FROM network_edges_ctu',
                :sourceNodeId,
                :targetNodeId,
                directed := false
              ) as path
              join network_edges_ctu e on path.edge = e.id
            order by
              path.seq
        """, nativeQuery = true)
    List<GeoJsonProjection> findShortestPathAsGeojson(
        @Param("sourceNodeId") Integer sourceNodeId,
        @Param("targetNodeId") Integer targetNodeId
    );

    // Projection tạm hứng chuỗi Text của properties từ SQL
    interface GeoJsonProjection {
        Object getId();

        org.geolatte.geom.Geometry<?> getGeometry();

        String getProperties();
    }
}
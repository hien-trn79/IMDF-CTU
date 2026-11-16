package com.example.backend_imdf_ctu.repository;

import com.example.backend_imdf_ctu.entity.Anchor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IndoorRoutingRepository extends JpaRepository<Anchor, Integer> {

    @Query(value = """
            with params as (
                select
                    CAST(:sourceNodeId AS integer) as src_id,
                    CAST(:sourceLocationType AS text) as src_type,
                    CAST(:sourceLevelId AS integer) as src_level,
                    CAST(:targetNodeId AS integer) as tgt_id,
                    CAST(:targetLocationType AS text) as tgt_type,
                    CAST(:targetLevelId AS integer) as tgt_level,
                    COALESCE(CAST(:isOutdoorIncluded AS boolean), false) as outdoor_included
            ),
            resolved_levels as (
                select
                    p.src_id,
                    p.src_type,
                    p.tgt_id,
                    p.tgt_type,
                    p.tgt_level,
                    p.outdoor_included,
                    case
                        when p.src_level is not null then p.src_level
                        when p.outdoor_included then (select l.id from level l order by l.ordinal asc limit 1)
                        else p.tgt_level
                    end as effective_src_level
                from params p
            ),
            resolved_src as (
                select
                    rl.effective_src_level as level_id,
                    (
                        select n.id
                        from network_nodes_ctu n
                        where n.indoor_route_id in (
                            select i.id from indoor_route i where i.level_id = rl.effective_src_level
                        )
                        order by n.geometry <-> coalesce(
                            case
                                when rl.outdoor_included and rl.src_id is null then
                                    st_setsrid(st_point(105.76843, 10.03031), 4326)
                                when rl.src_type = 'unit' then coalesce(
                                    (select a.geometry from anchor a where a.unit_id = rl.src_id limit 1),
                                    (select u.geometry from unit u where u.id = rl.src_id limit 1)
                                )
                                when rl.src_type = 'amenity' then coalesce(
                                    (
                                        select a.geometry
                                        from public.amenities am
                                        join anchor a on a.unit_id = am.unit_id
                                        where am.id = rl.src_id and am.unit_id is not null
                                        limit 1
                                    ),
                                    (select am.geometry from public.amenities am where am.id = rl.src_id limit 1)
                                )
                                when rl.src_type = 'anchor' then (
                                    select a.geometry from anchor a where a.id = rl.src_id limit 1
                                )
                                else null
                            end,
                            st_setsrid(st_point(105.76843, 10.03031), 4326)
                        )
                        limit 1
                    ) as node_id
                from resolved_levels rl
            ),
            resolved_tgt as (
                select
                    rl.tgt_level as level_id,
                    (
                        select n.id
                        from network_nodes_ctu n
                        where n.indoor_route_id in (
                            select i.id from indoor_route i where i.level_id = rl.tgt_level
                        )
                        order by n.geometry <-> coalesce(
                            case
                                when rl.tgt_type = 'unit' then coalesce(
                                    (select a.geometry from anchor a where a.unit_id = rl.tgt_id limit 1),
                                    (select u.geometry from unit u where u.id = rl.tgt_id limit 1)
                                )
                                when rl.tgt_type = 'amenity' then coalesce(
                                    (
                                        select a.geometry
                                        from public.amenities am
                                        join anchor a on a.unit_id = am.unit_id
                                        where am.id = rl.tgt_id and am.unit_id is not null
                                        limit 1
                                    ),
                                    (select am.geometry from public.amenities am where am.id = rl.tgt_id limit 1)
                                )
                                when rl.tgt_type = 'anchor' then (
                                    select a.geometry from anchor a where a.id = rl.tgt_id limit 1
                                )
                                else null
                            end,
                            st_setsrid(st_point(105.76843, 10.03031), 4326)
                        )
                        limit 1
                    ) as node_id
                from resolved_levels rl
            ),
            same_floor_path as (
                select
                    e.id as edge_id,
                    e.geometry as geometry,
                    e.cost as cost,
                    e.indoor_route_id as route_id,
                    s.level_id as level_id,
                    path.seq::int as seq
                from resolved_src s
                cross join resolved_tgt t
                cross join lateral pgr_dijkstra(
                    format(
                        'SELECT id::bigint AS id, source::bigint AS source, target::bigint AS target, cost::float8 AS cost, reverse_cost::float8 AS reverse_cost FROM network_edges_ctu WHERE indoor_route_id IN (SELECT id FROM indoor_route WHERE level_id = %s)',
                        s.level_id
                    ),
                    s.node_id,
                    t.node_id,
                    directed := false
                ) as path
                join network_edges_ctu e on path.edge = e.id
                where s.level_id = t.level_id
                  and s.node_id is not null
                  and t.node_id is not null
                  and path.edge <> -1
            ),
            stair_candidates as (
                select
                    s.node_id as src_node,
                    t.node_id as tgt_node,
                    s.level_id as src_level,
                    t.level_id as tgt_level,
                    sa.id as src_stair_amenity_id,
                    ta.id as tgt_stair_amenity_id,
                    sn.id as src_stair_node,
                    tn.id as tgt_stair_node
                from resolved_src s
                cross join resolved_tgt t
                join public.amenities sa
                    on sa.amenity_category_id = 13
                   and sa.level_id = s.level_id
                join public.amenities ta
                    on ta.amenity_category_id = 13
                   and ta.level_id = t.level_id
                   and (
                        trim(lower(sa.amenity_name)) = trim(lower(ta.amenity_name))
                        or st_dwithin(sa.geometry, ta.geometry, 0.0002)
                   )
                cross join lateral (
                    select n.id
                    from network_nodes_ctu n
                    where n.indoor_route_id in (
                        select i.id from indoor_route i where i.level_id = s.level_id
                    )
                    order by n.geometry <-> sa.geometry
                    limit 1
                ) sn
                cross join lateral (
                    select n.id
                    from network_nodes_ctu n
                    where n.indoor_route_id in (
                        select i.id from indoor_route i where i.level_id = t.level_id
                    )
                    order by n.geometry <-> ta.geometry
                    limit 1
                ) tn
                where s.level_id <> t.level_id
                  and s.node_id is not null
                  and t.node_id is not null
            ),
            stair_evaluated as (
                select
                    sc.*,
                    (
                        select coalesce(agg_cost, 1e18)
                        from pgr_dijkstraCost(
                            format(
                                'SELECT id::bigint AS id, source::bigint AS source, target::bigint AS target, cost::float8 AS cost, reverse_cost::float8 AS reverse_cost FROM network_edges_ctu WHERE indoor_route_id IN (SELECT id FROM indoor_route WHERE level_id = %s)',
                                sc.src_level
                            ),
                            sc.src_node,
                            sc.src_stair_node,
                            directed := false
                        )
                        limit 1
                    ) +
                    (
                        select coalesce(agg_cost, 1e18)
                        from pgr_dijkstraCost(
                            format(
                                'SELECT id::bigint AS id, source::bigint AS source, target::bigint AS target, cost::float8 AS cost, reverse_cost::float8 AS reverse_cost FROM network_edges_ctu WHERE indoor_route_id IN (SELECT id FROM indoor_route WHERE level_id = %s)',
                                sc.tgt_level
                            ),
                            sc.tgt_stair_node,
                            sc.tgt_node,
                            directed := false
                        )
                        limit 1
                    ) as total_cost
                from stair_candidates sc
            ),
            best_stair as (
                select *
                from stair_evaluated
                where total_cost < 1e18
                order by total_cost asc
                limit 1
            ),
            seg_1 as (
                select
                    e.id as edge_id,
                    e.geometry as geometry,
                    e.cost as cost,
                    e.indoor_route_id as route_id,
                    bs.src_level as level_id,
                    path.seq::int as seq
                from best_stair bs
                cross join lateral pgr_dijkstra(
                    format(
                        'SELECT id::bigint AS id, source::bigint AS source, target::bigint AS target, cost::float8 AS cost, reverse_cost::float8 AS reverse_cost FROM network_edges_ctu WHERE indoor_route_id IN (SELECT id FROM indoor_route WHERE level_id = %s)',
                        bs.src_level
                    ),
                    bs.src_node,
                    bs.src_stair_node,
                    directed := false
                ) as path
                join network_edges_ctu e on path.edge = e.id
                where path.edge <> -1
            ),
            seg_2 as (
                select
                    e.id as edge_id,
                    e.geometry as geometry,
                    e.cost as cost,
                    e.indoor_route_id as route_id,
                    bs.tgt_level as level_id,
                    ((select coalesce(max(seq), 0) from seg_1) + path.seq)::int as seq
                from best_stair bs
                cross join lateral pgr_dijkstra(
                    format(
                        'SELECT id::bigint AS id, source::bigint AS source, target::bigint AS target, cost::float8 AS cost, reverse_cost::float8 AS reverse_cost FROM network_edges_ctu WHERE indoor_route_id IN (SELECT id FROM indoor_route WHERE level_id = %s)',
                        bs.tgt_level
                    ),
                    bs.tgt_stair_node,
                    bs.tgt_node,
                    directed := false
                ) as path
                join network_edges_ctu e on path.edge = e.id
                where path.edge <> -1
            ),
            combined as (
                select * from same_floor_path
                union all
                select * from seg_1
                union all
                select * from seg_2
            )
            select
                edge_id as id,
                geometry as geometry,
                jsonb_build_object(
                    'seq', seq,
                    'cost', cost,
                    'route_id', route_id,
                    'levelId', level_id
                )::text as properties
            from combined
            order by seq asc
        """, nativeQuery = true)
    List<GeoJsonProjection> findMultiFloorShortestPath(
        @Param("sourceNodeId") Integer sourceNodeId,
        @Param("sourceLocationType") String sourceLocationType,
        @Param("sourceLevelId") Integer sourceLevelId,
        @Param("targetNodeId") Integer targetNodeId,
        @Param("targetLocationType") String targetLocationType,
        @Param("targetLevelId") Integer targetLevelId,
        @Param("isOutdoorIncluded") Boolean isOutdoorIncluded
    );

    interface GeoJsonProjection {
        Object getId();
        org.geolatte.geom.Geometry<?> getGeometry();
        String getProperties();
    }
}
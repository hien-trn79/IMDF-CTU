package com.example.backend_imdf_ctu.entity;

import com.example.backend_imdf_ctu.enums.EntityType;
import com.example.backend_imdf_ctu.enums.HistoryAction;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;

@Entity
@Table(name = "entity_history")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class EntityHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Enumerated(EnumType.STRING)
    @Column(name = "entity_type")
    private EntityType entityType;

    @Column(name = "entity_id")
    private Integer entityId;

    @Enumerated(EnumType.STRING)
    @Column(name = "action", nullable = false)
    private HistoryAction action;

    @Column(name = "performed_by")
    private Integer performedBy;

    @Column(name = "timestamp", nullable = false)
    private Instant timestamp;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "new_value", columnDefinition = "json")
    private Map<String, Object> newValue;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "old_value", columnDefinition = "json")
    private Map<String, Object> oldValue;

    public EntityHistory(EntityType entityType, Integer entityId, HistoryAction action, Integer performedBy, Instant timestamp, Map<String, Object> newValue, Map<String, Object> oldValue) {
        this.entityType = entityType;
        this.entityId = entityId;
        this.action = action;
        this.performedBy = performedBy;
        this.timestamp = timestamp;
        this.newValue = newValue;
        this.oldValue = oldValue;
    }

}

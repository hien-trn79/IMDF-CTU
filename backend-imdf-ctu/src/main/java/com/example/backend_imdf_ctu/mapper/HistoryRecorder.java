package com.example.backend_imdf_ctu.mapper;

import com.example.backend_imdf_ctu.entity.EntityHistory;
import com.example.backend_imdf_ctu.enums.EntityType;
import com.example.backend_imdf_ctu.enums.HistoryAction;
import com.example.backend_imdf_ctu.exception.BusinessException;
import com.example.backend_imdf_ctu.exception.ErrorCode;
import com.example.backend_imdf_ctu.repository.EntityHistoryRepository;
import com.example.backend_imdf_ctu.repository.UserRepository;
import lombok.AllArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class HistoryRecorder {

    private final EntityHistoryRepository historyRepository;
    private final UserRepository userRepository;

    /** MANDATORY: bắt buộc chạy trong transaction của service, lỗi sẽ rollback cả hai. */
    public void record(
        EntityType type,
        Integer entityId,
        HistoryAction action,
        Map<String, Object> before,
        Map<String, Object> after
    ) {
        historyRepository.save(
            new EntityHistory(
                type,
                entityId,
                action,
                currentUserId(),
                Instant.now(),
                after,
                before
            )
        );
    }

    private Integer currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND);
        }
        return userRepository.findByEmail(auth.getName())
            .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND))
            .getUserId();
    }
}

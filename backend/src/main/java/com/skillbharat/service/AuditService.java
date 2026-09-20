package com.skillbharat.service;

import com.skillbharat.domain.AuditLog;
import com.skillbharat.repository.AuditLogRepository;
import com.skillbharat.security.AuthUser;
import com.skillbharat.web.dto.AdminDtos.AuditLogView;
import com.skillbharat.web.dto.CommonDtos.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository logs;

    /** Joins the caller's transaction, so an action and its audit entry commit (or roll back) together. */
    @Transactional
    public void record(AuthUser actor, String action, String entityType, Long entityId, String details) {
        AuditLog log = new AuditLog();
        log.setActorId(actor == null ? null : actor.id());
        log.setActorEmail(actor == null ? "system" : actor.email());
        log.setAction(action);
        log.setEntityType(entityType);
        log.setEntityId(entityId);
        log.setDetails(details != null && details.length() > 500 ? details.substring(0, 500) : details);
        logs.save(log);
    }

    @Transactional(readOnly = true)
    public PageResponse<AuditLogView> list(int page, int size) {
        PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100),
                Sort.by(Sort.Direction.DESC, "createdAt", "id"));
        return PageResponse.of(logs.findAll(pageable).map(l -> new AuditLogView(l.getId(), l.getActorId(),
                l.getActorEmail(), l.getAction(), l.getEntityType(), l.getEntityId(), l.getDetails(),
                l.getCreatedAt())));
    }
}

package com.example.backend.DTO;

import com.example.backend.Entity.type.InvitationStatus;
import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkerFarmInvitationDto {
    private Long id;
    private Long farmId;
    private String farmName;
    private String farmAddress;
    private Long workerId;
    private String workerName;
    private String workerEmail;
    private InvitationStatus status;
    private LocalDateTime createdAt;
}

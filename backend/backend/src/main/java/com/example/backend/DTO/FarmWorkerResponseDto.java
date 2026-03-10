package com.example.backend.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FarmWorkerResponseDto {
    private Long id;
    private Long workerId;
    private String name;
    private String email;
    private String shed;
}

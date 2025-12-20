package com.example.backend.DTO;

import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CattleResponseDto {

    private Long id;
    private String tagId;
    private String breed;
    private String status;
    private Long farmId;
}

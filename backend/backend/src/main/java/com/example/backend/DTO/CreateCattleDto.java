package com.example.backend.DTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CreateCattleDto {

    @NotBlank
    private String tagId;

    private String breed;

    private String type;

    @NotBlank
    private String status; // ACTIVE / SICK / SOLD

    private Long shedId;

    @NotNull
    private Long farmId;
}

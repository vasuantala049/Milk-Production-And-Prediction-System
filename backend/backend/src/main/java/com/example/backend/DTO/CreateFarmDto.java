package com.example.backend.DTO;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CreateFarmDto {
    private String name;
    private String address;

    // TEMP until Spring Security
    private Long ownerId;
}


package com.example.backend.DTO;

import com.example.backend.Entity.type.UserRole;
import jakarta.validation.constraints.*;
import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CreateUserRequestDto {

    @NotBlank
    private String name;

    @Email
    @NotBlank
    private String email;

    private String password;

    @NotNull
    private UserRole role;

    // REQUIRED when role = OWNER
    private CreateFarmDto farm;

    // REQUIRED when role = WORKER
    private Long farmId;

    private String shed;
}

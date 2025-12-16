package com.example.backend.DTO;

import com.example.backend.Entity.type.UserRole;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CreateUserRequestDto {
    private String name;
    private String email;
    private UserRole role;
}

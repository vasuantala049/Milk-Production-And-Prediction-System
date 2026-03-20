package com.example.backend.DTO;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ResetPasswordWithOtpRequestDto {
    @Email
    @NotBlank
    private String email;

    @NotBlank
    @Size(min = 4, max = 10)
    private String otp;

    @NotBlank
    @Size(min = 6, max = 100)
    private String newPassword;
}

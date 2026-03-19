package com.example.backend.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RazorpayOrderResponseDto {
    private String keyId;
    private String razorpayOrderId;
    private Long amount;
    private String currency;
    private String receipt;
}

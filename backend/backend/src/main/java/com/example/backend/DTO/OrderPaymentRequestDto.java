package com.example.backend.DTO;

import lombok.Data;

@Data
public class OrderPaymentRequestDto {
    private Double amount;
    private String razorpayOrderId;
    private String razorpayPaymentId;
    private String razorpaySignature;
}

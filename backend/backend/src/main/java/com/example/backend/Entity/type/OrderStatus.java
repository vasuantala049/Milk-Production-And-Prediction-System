package com.example.backend.Entity.type;

public enum OrderStatus {
    PENDING, // awaiting owner approval
    CREATED, // order placed
    CONFIRMED, // inventory reserved
    COMPLETED, // milk delivered
    CANCELLED, // order cancelled
    TIMEOUT_REJECTED // auto-cancelled after timeout
}

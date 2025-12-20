package com.example.backend.Entity.type;

public enum OrderStatus {
    CREATED,        // order placed
    CONFIRMED,      // inventory reserved
    COMPLETED,      // milk delivered
    CANCELLED       // order cancelled
}

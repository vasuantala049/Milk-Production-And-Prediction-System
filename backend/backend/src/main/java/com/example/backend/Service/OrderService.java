package com.example.backend.Service;

import com.example.backend.DTO.OrderResponseDto;
import com.example.backend.Entity.User;

import java.util.List;

public interface OrderService {
    /**
     * Approve a pending order (farm owner/worker only)
     */
    OrderResponseDto approveOrder(Long orderId, User user);

    /**
     * Reject a pending order (farm owner/worker only)
     */
    void rejectOrder(Long orderId, User user);

    /**
     * Get all pending orders for a farm
     */
    List<OrderResponseDto> getPendingOrders(Long farmId, User user);
}

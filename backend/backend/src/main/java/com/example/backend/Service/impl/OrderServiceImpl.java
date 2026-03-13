package com.example.backend.Service.impl;

import com.example.backend.DTO.OrderResponseDto;
import com.example.backend.Entity.MilkAllocation;
import com.example.backend.Entity.MilkInventory;
import com.example.backend.Entity.Orders;
import com.example.backend.Entity.User;
import com.example.backend.Entity.type.AllocationType;
import com.example.backend.Entity.type.OrderStatus;
import com.example.backend.Repository.MilkAllocationRepository;
import com.example.backend.Repository.MilkInventoryRepository;
import com.example.backend.Repository.OrdersRepository;
import com.example.backend.Service.FarmAccessService;
import com.example.backend.Service.OrderService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

        private final OrdersRepository ordersRepository;
        private final MilkInventoryRepository milkInventoryRepository;
        private final MilkAllocationRepository milkAllocationRepository;
        private final FarmAccessService farmAccessService;

        @Override
        @Transactional
        public OrderResponseDto approveOrder(Long orderId, User user) {
                // 1. Find order
                Orders order = ordersRepository.findById(orderId)
                                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

                // 2. Verify user has access to the farm
                farmAccessService.verifyFarmAccess(user, order.getFarm().getId());

                // 3. Verify order is in PENDING status
                if (order.getStatus() != OrderStatus.PENDING) {
                        throw new IllegalStateException(
                                        "Only pending orders can be approved. Current status: " + order.getStatus());
                }

                // 4. Update order status to CONFIRMED (no milk availability check required)
                // Owner may have external milk sources not tracked in the system
                order.setStatus(OrderStatus.CONFIRMED);
                ordersRepository.save(order);

                // 9. Return response
                return mapToDto(order);
        }



    @Override
    @Transactional
    public OrderResponseDto rejectOrder(Long orderId, User user) {
        // 1. Find order
        Orders order = ordersRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        // 2. Verify user has access to the farm
        farmAccessService.verifyFarmAccess(user, order.getFarm().getId());

        // 3. Verify order is in PENDING status
        if (order.getStatus() != OrderStatus.PENDING) {
            throw new IllegalStateException(
                    "Only pending orders can be rejected. Current status: " + order.getStatus());
        }

        // 4. Update status to CANCELLED
        order.setStatus(OrderStatus.CANCELLED);
        ordersRepository.save(order);

        return mapToDto(order);
    }

    @Override
    public List<OrderResponseDto> getPendingOrders(Long farmId, User user) {
        // 1. Verify user has access to the farm
        farmAccessService.verifyFarmAccess(user, farmId);

        // 2. Fetch pending orders for this farm
        List<Orders> pendingOrders = ordersRepository.findByFarm_IdAndStatus(farmId, OrderStatus.PENDING);

        // 3. Map to DTOs
        return pendingOrders.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public OrderResponseDto payForOrder(Long orderId, Double amount, User user) {
        Orders order = ordersRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        if (order.getBuyer() == null || !order.getBuyer().getId().equals(user.getId())) {
            throw new IllegalStateException("Only the buyer can pay for this order");
        }

        if (order.getStatus() != OrderStatus.CONFIRMED) {
            throw new IllegalStateException("Only confirmed orders can be paid");
        }

        if (Boolean.TRUE.equals(order.getPaid())) {
            throw new IllegalStateException("Order is already paid");
        }

        if (amount == null) {
            throw new IllegalArgumentException("Payment amount is required");
        }

        double expected = order.getTotalPrice() == null ? 0.0 : order.getTotalPrice();
        if (Math.abs(amount - expected) > 0.0001) {
            throw new IllegalArgumentException("Payment amount must be exactly " + expected);
        }

        order.setPaid(true);
        order.setPaidAmount(amount);
        order.setPaidAt(LocalDateTime.now());
        ordersRepository.save(order);

        return mapToDto(order);
    }

    private OrderResponseDto mapToDto(Orders order) {
        OrderResponseDto dto = new OrderResponseDto();
        dto.setId(order.getId());
        dto.setDisplayCode(resolveDisplayCode(order));
        dto.setOrderDate(order.getOrderDate());
        dto.setQuantity(order.getQuantity());
        dto.setSession(order.getSession());
        dto.setStatus(order.getStatus());
        dto.setBuyerId(order.getBuyer() != null ? order.getBuyer().getId() : null);
        dto.setBuyerName(order.getBuyer() != null ? order.getBuyer().getName() : order.getBuyerName());
        dto.setFarmId(order.getFarm() != null ? order.getFarm().getId() : null);
        dto.setFarmName(order.getFarm() != null ? order.getFarm().getName() : order.getFarmName());
        dto.setAnimalType(order.getAnimalType());
        dto.setTotalPrice(order.getTotalPrice());
        dto.setPaid(Boolean.TRUE.equals(order.getPaid()));
        dto.setPaidAmount(order.getPaidAmount());
        dto.setPaidAt(order.getPaidAt());
        return dto;
    }

    private String resolveDisplayCode(Orders order) {
        if (order.getDisplayCode() != null && !order.getDisplayCode().isBlank()) {
            return order.getDisplayCode();
        }
        return String.format("%06d", order.getId());
    }
}

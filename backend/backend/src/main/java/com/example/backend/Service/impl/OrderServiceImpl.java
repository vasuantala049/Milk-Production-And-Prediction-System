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

        // 4. Lock inventory and verify availability
        MilkInventory inventory = milkInventoryRepository
                .lockInventory(
                        order.getFarm().getId(),
                        order.getOrderDate(),
                        order.getSession())
                .orElseThrow(() -> new IllegalStateException("Milk inventory not found for this order"));

        // 5. Calculate available milk
        Double totalProduction = inventory.getMilkLiters();
        Double allocatedMilk = milkAllocationRepository.sumAllocationsByInventoryId(inventory.getId());
        Double availableMilk = totalProduction - allocatedMilk;

        // 6. Verify sufficient milk is still available
        if (availableMilk < order.getQuantity()) {
            throw new IllegalStateException(
                    "Insufficient milk available. Required: " + order.getQuantity() +
                            "L, Available: " + availableMilk + "L");
        }

        // 7. Create allocation
        MilkAllocation allocation = MilkAllocation.builder()
                .milkInventory(inventory)
                .quantity(order.getQuantity())
                .type(AllocationType.ORDER)
                .referenceId(order.getId())
                .build();
        milkAllocationRepository.save(allocation);

        // 8. Update order status
        order.setStatus(OrderStatus.CONFIRMED);
        ordersRepository.save(order);

        // 9. Return response
        return mapToDto(order);
    }

    @Override
    @Transactional
    public void rejectOrder(Long orderId, User user) {
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

    private OrderResponseDto mapToDto(Orders order) {
        OrderResponseDto dto = new OrderResponseDto();
        dto.setId(order.getId());
        dto.setOrderDate(order.getOrderDate());
        dto.setQuantity(order.getQuantity());
        dto.setSession(order.getSession());
        dto.setStatus(order.getStatus());
        dto.setBuyerId(order.getBuyer() != null ? order.getBuyer().getId() : null);
        dto.setFarmId(order.getFarm() != null ? order.getFarm().getId() : null);
        return dto;
    }
}

package com.example.backend.Service.impl;

import com.example.backend.DTO.MilkBuyDto;
import com.example.backend.DTO.OrderResponseDto;
import com.example.backend.Entity.Farm;
import com.example.backend.Entity.MilkAllocation;
import com.example.backend.Entity.MilkInventory;
import com.example.backend.Entity.Orders;
import com.example.backend.Entity.User;
import com.example.backend.Entity.type.AllocationType;
import com.example.backend.Entity.type.OrderStatus;
import com.example.backend.Repository.FarmRepository;
import com.example.backend.Repository.MilkAllocationRepository;
import com.example.backend.Repository.MilkInventoryRepository;
import com.example.backend.Repository.OrdersRepository;
import com.example.backend.Service.BuyMilkService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class BuyMilkServiceImpl implements BuyMilkService {

    private final OrdersRepository ordersRepository;
    private final MilkInventoryRepository milkInventoryRepository;
    private final MilkAllocationRepository milkAllocationRepository;
    private final FarmRepository farmRepository;

    @Transactional
    @org.springframework.cache.annotation.Caching(evict = {
        @CacheEvict(value = "todayMilkBreakdown", key = "#dto.farmId"),
        @CacheEvict(value = "farmsList", allEntries = true)
    })
    @Override
    public OrderResponseDto buyMilk(MilkBuyDto dto, User user) {

        // 1. Resolve buyer
        User buyer = user;

        // 2. Resolve farm (SELLER) from request
        Farm farm = farmRepository.findById(dto.getFarmId())
                .orElseThrow(() -> new IllegalStateException("Farm not found"));

        // 3. Validate quantity
        double requestedQty = dto.getQuantity();
        if (requestedQty <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than zero");
        }

        // 4. Fetch available milk for session + date
        MilkInventory inventory = milkInventoryRepository
                .lockInventory(
                        farm.getId(),
                        dto.getDate(),
                        dto.getSession()
                )
                .orElseThrow(() ->
                        new IllegalStateException("Milk not available for selected session")
                );

        // 5. Calculate available milk (total production - allocations)
        Double totalProduction = inventory.getMilkLiters();
        Double allocatedMilk = milkAllocationRepository.sumAllocationsByInventoryId(inventory.getId());
        Double availableMilk = totalProduction - allocatedMilk;

        // 6. Check availability
        if (availableMilk < requestedQty) {
            throw new IllegalStateException("Insufficient milk available. Available: " + availableMilk + "L");
        }

        // 7. Create order
        Orders order = new Orders();
        order.setOrderDate(LocalDate.now());
        order.setQuantity(requestedQty);
        order.setSession(dto.getSession());
        order.setStatus(OrderStatus.COMPLETED);
        order.setBuyer(buyer);
        order.setFarm(farm);

        ordersRepository.save(order);

        // 8. Create allocation record (instead of deducting from inventory)
        MilkAllocation allocation = MilkAllocation.builder()
                .milkInventory(inventory)
                .quantity(requestedQty)
                .type(AllocationType.ORDER)
                .referenceId(order.getId())
                .build();
        milkAllocationRepository.save(allocation);

        // 9. Map to DTO and return
        OrderResponseDto dto1 = new OrderResponseDto();
        dto1.setId(order.getId());
        dto1.setOrderDate(order.getOrderDate());
        dto1.setQuantity(order.getQuantity());
        dto1.setSession(order.getSession());
        dto1.setStatus(order.getStatus());
        dto1.setBuyerId(buyer != null ? buyer.getId() : null);
        dto1.setFarmId(farm != null ? farm.getId() : null);

        return dto1;
    }
}

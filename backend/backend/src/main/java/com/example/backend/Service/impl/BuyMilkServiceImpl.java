package com.example.backend.Service.impl;

import com.example.backend.DTO.MilkBuyDto;
import com.example.backend.DTO.OrderResponseDto;
import com.example.backend.Entity.Farm;
import com.example.backend.Entity.MilkInventory;
import com.example.backend.Entity.Orders;
import com.example.backend.Entity.User;
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

        // 4. Validate time-based slot restrictions (for today's date only)
        LocalDate orderDate = dto.getDate();
        if (orderDate.equals(LocalDate.now()) && dto.getSession() != com.example.backend.Entity.type.MilkSession.ALL) {
            validateTimeSlot(dto.getSession());
        }

        // 5. Fetch available milk to verify availability
        double availableMilk = 0;
        if (dto.getSession() == com.example.backend.Entity.type.MilkSession.ALL) {
            java.util.List<MilkInventory> inventories = milkInventoryRepository.findByFarmIdAndRecordDate(farm.getId(),
                    dto.getDate());
            for (MilkInventory inv : inventories) {
                Double totalProd = inv.getMilkLiters();
                Double allocatedMilk = milkAllocationRepository.sumAllocationsByInventoryId(inv.getId());
                availableMilk += (totalProd - allocatedMilk);
            }
        } else {
            MilkInventory inventory = milkInventoryRepository
                    .lockInventory(
                            farm.getId(),
                            dto.getDate(),
                            dto.getSession())
                    .orElseThrow(() -> new IllegalStateException("Milk not available for selected session"));

            Double totalProduction = inventory.getMilkLiters();
            Double allocatedMilk = milkAllocationRepository.sumAllocationsByInventoryId(inventory.getId());
            availableMilk = totalProduction - allocatedMilk;
        }

        // 7. Check availability
        if (availableMilk < requestedQty) {
            throw new IllegalStateException("Insufficient milk available. Available: " + availableMilk + "L");
        }

        // 8. Create order with PENDING status (awaiting owner approval)
        Orders order = new Orders();
        order.setOrderDate(LocalDate.now());
        order.setQuantity(requestedQty);
        order.setSession(dto.getSession());
        order.setStatus(OrderStatus.PENDING); // Changed from COMPLETED to PENDING
        order.setBuyer(buyer);
        order.setFarm(farm);

        ordersRepository.save(order);

        // NOTE: Allocation will be created when owner approves the order
        // This prevents allocating milk for orders that may be rejected

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

    /**
     * Validates time-based slot restrictions for same-day orders
     */
    private void validateTimeSlot(com.example.backend.Entity.type.MilkSession session) {
        java.time.LocalTime now = java.time.LocalTime.now();

        if (session == com.example.backend.Entity.type.MilkSession.MORNING) {
            // Morning slot (6 AM - 10 AM) cannot be selected after 10 AM
            if (now.isAfter(java.time.LocalTime.of(10, 0))) {
                throw new IllegalStateException("Morning slot (6 AM - 10 AM) cannot be selected after 10:00 AM");
            }
        } else if (session == com.example.backend.Entity.type.MilkSession.EVENING) {
            // Evening slot (4 PM - 8 PM) cannot be selected after 8 PM
            if (now.isAfter(java.time.LocalTime.of(20, 0))) {
                throw new IllegalStateException("Evening slot (4 PM - 8 PM) cannot be selected after 8:00 PM");
            }
        }
    }
}
